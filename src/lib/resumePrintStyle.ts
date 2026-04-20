export const RESUME_PRINT_PAGE_STYLE = `
  @page {
    size: Letter;
    margin: 0.55in 0.6in;
    @top-left     { content: ""; }
    @top-center   { content: ""; }
    @top-right    { content: ""; }
    @bottom-left  { content: ""; }
    @bottom-center{ content: ""; }
    @bottom-right { content: ""; }
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #1a1a1a !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /*
      The editor and public view mount the printable document inside a
      hidden, off-screen container. react-to-print clones that container
      into an iframe on desktop — fine — but iOS Safari ignores the
      iframe and falls back to printing the live DOM. Without the
      rules below, that fallback captures the whole page chrome
      (sticky header, contact rail, scaled preview, footer) and
      produces a ghostly multi-page PDF with the resume cropped.

      To make every browser path (the button, Cmd/Ctrl+P, and iOS
      Share Sheet → Save to Files) converge on the same clean output,
      we portal the hidden print container to document.body and hide
      every other top-level child during print.
    */
    body > *:not([data-print-root]) {
      display: none !important;
    }
    [data-print-root] {
      position: static !important;
      left: auto !important;
      top: auto !important;
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
    }
    [data-resume-document] {
      padding: 0 !important;
      box-shadow: none !important;
    }
    [data-resume-entry] {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    [data-resume-section-header] {
      break-after: avoid-page;
      page-break-after: avoid;
    }
    [data-resume-section] > :first-child + * {
      break-before: avoid;
      page-break-before: avoid;
    }
    a { color: inherit !important; text-decoration: none !important; }
  }
`
