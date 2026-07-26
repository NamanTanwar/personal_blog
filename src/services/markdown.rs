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

#[cfg(test)]
mod tests {
    use super::*;
 
    // ═══════════════════════════════════════════════════
    // Basic Rendering
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_render_paragraph() {
        let html = render_markdown("Hello world");
        assert!(html.contains("<p>"));
        assert!(html.contains("Hello world"));
    }
 
    #[test]
    fn test_render_bold() {
        let html = render_markdown("This is **bold** text");
        assert!(html.contains("<strong>bold</strong>"));
    }
 
    #[test]
    fn test_render_italic() {
        let html = render_markdown("This is *italic* text");
        assert!(html.contains("<em>italic</em>"));
    }
 
    #[test]
    fn test_render_link() {
        let html = render_markdown("[click here](https://example.com)");
        assert!(html.contains("href=\"https://example.com\""));
        assert!(html.contains("click here"));
    }
 
    #[test]
    fn test_render_image() {
        let html = render_markdown("![alt text](https://example.com/img.png)");
        assert!(html.contains("<img"));
        assert!(html.contains("src=\"https://example.com/img.png\""));
        assert!(html.contains("alt=\"alt text\""));
    }
 
    #[test]
    fn test_render_unordered_list() {
        let html = render_markdown("- item one\n- item two\n- item three");
        assert!(html.contains("<ul>"));
        assert!(html.contains("<li>"));
        assert!(html.contains("item one"));
        assert!(html.contains("item three"));
    }
 
    #[test]
    fn test_render_ordered_list() {
        let html = render_markdown("1. first\n2. second\n3. third");
        assert!(html.contains("<ol>"));
        assert!(html.contains("first"));
        assert!(html.contains("third"));
    }
 
    #[test]
    fn test_render_blockquote() {
        let html = render_markdown("> This is a quote");
        assert!(html.contains("<blockquote>"));
        assert!(html.contains("This is a quote"));
    }
 
    #[test]
    fn test_render_empty_string() {
        let html = render_markdown("");
        // Should not panic, may return empty string or whitespace
        assert!(html.trim().is_empty() || html.contains("<p>"));
    }
 
    // ═══════════════════════════════════════════════════
    // Headings and IDs
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_render_h2_heading() {
        let html = render_markdown("## Hello World");
        assert!(html.contains("<h2"));
        assert!(html.contains("Hello World"));
    }
 
    #[test]
    fn test_render_h3_heading() {
        let html = render_markdown("### Sub Section");
        assert!(html.contains("<h3"));
        assert!(html.contains("Sub Section"));
    }
 
    #[test]
    fn test_heading_has_id() {
        let html = render_markdown("## What is a Buffer Overflow");
        // Should generate an id attribute from the heading text
        assert!(html.contains("id=\""));
    }
 
    #[test]
    fn test_heading_id_is_lowercase_with_hyphens() {
        let html = render_markdown("## Stack Smashing Basics");
        assert!(html.contains("id=\"stack-smashing-basics\""));
    }
 
    // ═══════════════════════════════════════════════════
    // Code Blocks
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_render_inline_code() {
        let html = render_markdown("Use `printf()` here");
        assert!(html.contains("<code>"));
        assert!(html.contains("printf()"));
    }
 
    #[test]
    fn test_render_fenced_code_block() {
         let md = "```c\nvoid main() {}\n```";
    let html = render_markdown(md);
    assert!(html.contains("<pre"), "Expected <pre> tag in: {}", html);
    assert!(html.contains("void"), "Expected 'void' in: {}", html);
    assert!(html.contains("main"), "Expected 'main' in: {}", html);
    }
 
    #[test]
    fn test_render_code_block_without_language() {
        let md = "```\nhello world\n```";
        let html = render_markdown(md);
        assert!(html.contains("<pre"));
        assert!(html.contains("hello world"));
    }
 
    #[test]
    fn test_code_block_has_syntax_highlighting() {
        let md = "```rust\nfn main() {\n    println!(\"hello\");\n}\n```";
        let html = render_markdown(md);
        // Syntect wraps tokens in <span> with style attributes
        assert!(html.contains("<span"));
        assert!(html.contains("style="));
    }
 
    // ═══════════════════════════════════════════════════
    // Reading Time
    // ═══════════════════════════════════════════════════
 
    #[test]
    fn test_reading_time_short_text() {
        // ~50 words, should be 1 min (minimum)
        let text = "word ".repeat(50);
        let time = calculate_reading_time(&text);
        assert_eq!(time, 1);
    }
 
    #[test]
    fn test_reading_time_medium_text() {
        // 400 words = 2 minutes at 200 wpm
        let text = "word ".repeat(400);
        let time = calculate_reading_time(&text);
        assert_eq!(time, 2);
    }
 
    #[test]
    fn test_reading_time_long_text() {
        // 2000 words = 10 minutes at 200 wpm
        let text = "word ".repeat(2000);
        let time = calculate_reading_time(&text);
        assert_eq!(time, 10);
    }
 
    #[test]
    fn test_reading_time_rounds_up() {
        // 201 words should round up to 2 minutes
        let text = "word ".repeat(201);
        let time = calculate_reading_time(&text);
        assert_eq!(time, 2);
    }
 
    #[test]
    fn test_reading_time_empty() {
        let time = calculate_reading_time("");
        assert!(time <= 1);
    }
}