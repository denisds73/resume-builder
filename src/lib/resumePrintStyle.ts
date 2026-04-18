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
