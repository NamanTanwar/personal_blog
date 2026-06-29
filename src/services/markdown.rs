use pulldown_cmark::{html, CodeBlockKind, Event, Options, Parser, Tag, TagEnd};
use std::sync::OnceLock;
use syntect::highlighting::ThemeSet;
use syntect::html::highlighted_html_for_string;
use syntect::parsing::SyntaxSet;

// A struct to hold our heavy parsing dictionaries
struct Highlighter {
    syntax_set: SyntaxSet,
    theme_set: ThemeSet,
}

// Loads the dictionaries into memory once and shares them globally
fn get_highlighter() -> &'static Highlighter {
    static HIGHLIGHTER: OnceLock<Highlighter> = OnceLock::new();
    HIGHLIGHTER.get_or_init(|| Highlighter {
        syntax_set: SyntaxSet::load_defaults_newlines(),
        theme_set: ThemeSet::load_defaults(),
    })
}

// pub fn render_markdown(markdown: &str) -> String {
//     let mut options = Options::empty();
//     options.insert(Options::ENABLE_TABLES);
//     options.insert(Options::ENABLE_FOOTNOTES);
//     options.insert(Options::ENABLE_STRIKETHROUGH);
//     options.insert(Options::ENABLE_TASKLISTS);
//     options.insert(Options::ENABLE_HEADING_ATTRIBUTES); // Allows ## Title {#custom-id}

//     let parser = Parser::new_ext(markdown, options);
    
//     let mut in_code_block = false;
//     let mut current_lang = String::new();
//     let mut code_buffer = String::new();

//     // The interceptor pipeline
//     let events = parser.into_iter().filter_map(|event| match event {
//         // 1. We hit the start of a code block. Save the language and start buffering.
//         Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(ref lang))) => {
//             in_code_block = true;
//             current_lang = lang.to_string();
//             None // Don't output the default <pre><code> tag
//         }
//         Event::Start(Tag::CodeBlock(CodeBlockKind::Indented)) => {
//             in_code_block = true;
//             current_lang = String::new();
//             None
//         }
//         // 2. We are inside the block. Accumulate the raw code text.
//         Event::Text(ref text) if in_code_block => {
//             code_buffer.push_str(text);
//             None
//         }
//         // 3. The code block ended. Highlight it and inject the HTML!
//         Event::End(TagEnd::CodeBlock) => {
//             in_code_block = false;
//             let highlighter = get_highlighter();
            
//             // Look up the language (e.g., "rust", "c"). Default to plain text if not found.
//             let syntax = highlighter.syntax_set
//                 .find_syntax_by_token(&current_lang)
//                 .unwrap_or_else(|| highlighter.syntax_set.find_syntax_plain_text());
                
//             // Apply the ocean dark theme
//             let html = highlighted_html_for_string(
//                 &code_buffer,
//                 &highlighter.syntax_set,
//                 syntax,
//                 &highlighter.theme_set.themes["base16-ocean.dark"],
//             ).unwrap_or_else(|_| format!("<pre><code>{}</code></pre>", code_buffer));

//             code_buffer.clear();
//             current_lang.clear();
            
//             Some(Event::Html(html.into()))
//         }
//         // 4. For everything else (bold, italics, headers), just pass it through normally
//         _ => Some(event),
//     });

//     let mut html_output = String::new();
//     html::push_html(&mut html_output, events);
    
//     html_output
// }

pub fn render_markdown(markdown: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES); // Allows ## Title {#custom-id}

    let parser = Parser::new_ext(markdown, options);
    
    // Instead of filter_map, we collect the final events into this Vector
    let mut events = Vec::new();

    // 1. Code Block State
    let mut in_code_block = false;
    let mut current_lang = String::new();
    let mut code_buffer = String::new();

    // 2. Heading State
    let mut in_heading = false;
    let mut heading_text = String::new();
    let mut heading_buffer = Vec::new();

    for event in parser {
        // ==========================================
        // PIPELINE 1: SYNTAX HIGHLIGHTING
        // ==========================================
        if let Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(ref lang))) = event {
            in_code_block = true;
            current_lang = lang.to_string();
            continue;
        }
        if let Event::Start(Tag::CodeBlock(CodeBlockKind::Indented)) = event {
            in_code_block = true;
            current_lang = String::new();
            continue;
        }
        if in_code_block {
            match event {
                Event::Text(ref text) => code_buffer.push_str(text),
                Event::End(TagEnd::CodeBlock) => {
                    in_code_block = false;
                    let highlighter = get_highlighter();
                    
                    let syntax = highlighter.syntax_set
                        .find_syntax_by_token(&current_lang)
                        .unwrap_or_else(|| highlighter.syntax_set.find_syntax_plain_text());
                        
                    let html = highlighted_html_for_string(
                        &code_buffer,
                        &highlighter.syntax_set,
                        syntax,
                        &highlighter.theme_set.themes["base16-ocean.dark"],
                    ).unwrap_or_else(|_| format!("<pre><code>{}</code></pre>", code_buffer));

                    code_buffer.clear();
                    current_lang.clear();
                    
                    events.push(Event::Html(html.into()));
                }
                _ => {} // Ignore other elements inside code blocks
            }
            continue;
        }

        // ==========================================
        // PIPELINE 2: HEADING ID GENERATION
        // ==========================================
        if let Event::Start(Tag::Heading { level, id, classes, attrs }) = event {
            in_heading = true;
            // Buffer the start tag so we can safely mutate it later!
            heading_buffer.push(Event::Start(Tag::Heading { level, id, classes, attrs }));
            continue;
        }
        if in_heading {
            match &event {
                // Collect the text from the heading
                Event::Text(text) | Event::Code(text) => heading_text.push_str(text),
                
                Event::End(TagEnd::Heading(level)) => {
                    in_heading = false;
                    let slug = slug::slugify(&heading_text);
                    
                    // Go back in time and modify the Start tag in our buffer
                    if let Some(Event::Start(Tag::Heading { id, .. })) = heading_buffer.first_mut() {
                        // Only auto-generate if the user didn't explicitly provide an ID
                        if id.is_none() && !slug.is_empty() {
                            *id = Some(slug.into());
                        }
                    }
                    
                    // Flush the buffer to the main event stream
                    events.append(&mut heading_buffer);
                    events.push(Event::End(TagEnd::Heading(*level)));
                    
                    heading_text.clear();
                    continue;
                }
                _ => {}
            }
            // Keep buffering other elements (like bold/italics) inside the heading
            heading_buffer.push(event);
            continue;
        }

        // ==========================================
        // PIPELINE 3: PASS-THROUGH
        // ==========================================
        events.push(event);
    }

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());
    
    html_output
}

pub fn calculate_reading_time(markdown: &str) -> i64 {
    let word_count = markdown.split_whitespace().count();
    let mins = (word_count as f64 / 200.0).ceil() as i64;
    if mins == 0 { 1 } else { mins }
}