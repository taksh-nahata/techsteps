import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Function to parse and render markdown-like formatting that Gemini uses
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let elementKey = 0;

    // Safety check
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Split text by lines to handle different formatting
    const lines = text.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let line = lines[lineIndex];
      const lineElements: React.ReactNode[] = [];
      let lineKey = 0;

      // Handle headers (# ## ###)
      if (line.match(/^#{1,3}\s+/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const headerText = line.replace(/^#+\s+/, '');
        const HeaderTag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements; // h3, h4, h5, h6

        elements.push(
          <HeaderTag key={elementKey++} className="font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
            {parseInlineFormatting(headerText)}
          </HeaderTag>
        );
        continue;
      }

      // Handle bullet points (- or *)
      if (line.match(/^\s*[-*]\s+/)) {
        const bulletText = line.replace(/^\s*[-*]\s+/, '');
        elements.push(
          <div key={elementKey++} className="flex items-start mb-1">
            <span className="text-gray-600 mr-2 mt-1">•</span>
            <span>{parseInlineFormatting(bulletText)}</span>
          </div>
        );
        continue;
      }

      // Handle numbered lists (1. 2. etc.)
      if (line.match(/^\s*\d+\.\s+/)) {
        const numberMatch = line.match(/^\s*(\d+)\.\s+/);
        const number = numberMatch?.[1] || '1';
        const listText = line.replace(/^\s*\d+\.\s+/, '');

        elements.push(
          <div key={elementKey++} className="flex items-start mb-1">
            <span className="text-gray-600 mr-2 mt-1 font-medium">{number}.</span>
            <span>{parseInlineFormatting(listText)}</span>
          </div>
        );
        continue;
      }

      // Handle code blocks (```code```)
      if (line.includes('```')) {
        const codeMatch = line.match(/```([^`]+)```/g);
        if (codeMatch) {
          let processedLine = line;
          codeMatch.forEach((code, index) => {
            const codeContent = code.replace(/```/g, '');
            processedLine = processedLine.replace(code, `__CODE_BLOCK_${index}__`);
            lineElements.push(
              <code key={lineKey++} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                {codeContent}
              </code>
            );
          });

          // Process the rest of the line
          const parts = processedLine.split(/(__CODE_BLOCK_\d+__)/);
          parts.forEach((part) => {
            if (part.match(/^__CODE_BLOCK_\d+__$/)) {
              // Code block already added above
            } else if (part.trim()) {
              lineElements.push(
                <span key={lineKey++}>{parseInlineFormatting(part)}</span>
              );
            }
          });
        } else {
          lineElements.push(<span key={lineKey++}>{parseInlineFormatting(line)}</span>);
        }
      } else {
        // Regular line with inline formatting
        lineElements.push(<span key={lineKey++}>{parseInlineFormatting(line)}</span>);
      }

      // Add the line elements
      if (lineElements.length > 0) {
        elements.push(
          <div key={elementKey++} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
            {lineElements}
          </div>
        );
      } else if (line.trim() === '') {
        // Empty line for spacing
        elements.push(<div key={elementKey++} className="h-2" />);
      }
    }

    return elements;
  };

  // Function to handle inline formatting within a line
  const parseInlineFormatting = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let elementKey = 0;

    // Handle bold text (**text** or __text__)
    const boldRegex = /(\*\*([^*]+)\*\*|__([^_]+)__)/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        elements.push(...parseItalicAndCode(beforeText, elementKey));
        elementKey += 10; // Leave space for sub-elements
      }

      // Add bold text
      const boldText = match[2] || match[3]; // Either **text** or __text__
      elements.push(
        <strong key={elementKey++} className="font-semibold text-gray-900">
          {boldText}
        </strong>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      elements.push(...parseItalicAndCode(remainingText, elementKey));
    }

    return elements.length > 0 ? elements : [text];
  };

  // Function to handle italic and inline code
  const parseItalicAndCode = (text: string, startKey: number): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let elementKey = startKey;

    // Handle inline code (`code`)
    const codeRegex = /`([^`]+)`/g;
    let match;
    let lastIndex = 0;

    while ((match = codeRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        elements.push(...parseItalic(beforeText, elementKey));
        elementKey += 5;
      }

      // Add code text
      elements.push(
        <code key={elementKey++} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">
          {match[1]}
        </code>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      elements.push(...parseItalic(remainingText, elementKey));
    }

    return elements.length > 0 ? elements : [text];
  };

  // Function to handle italic text
  const parseItalic = (text: string, startKey: number): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let elementKey = startKey;

    // Handle italic text (*text* or _text_)
    const italicRegex = /(\*([^*]+)\*|_([^_]+)_)/g;
    let match;
    let lastIndex = 0;

    while ((match = italicRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          elements.push(<span key={elementKey++}>{beforeText}</span>);
        }
      }

      // Add italic text
      const italicText = match[2] || match[3]; // Either *text* or _text_
      elements.push(
        <em key={elementKey++} className="italic text-gray-800">
          {italicText}
        </em>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        elements.push(<span key={elementKey++}>{remainingText}</span>);
      }
    }

    return elements.length > 0 ? elements : [text];
  };

  return (
    <div className={`markdown-content ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;