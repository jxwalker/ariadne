# Source Contract

Every source artifact ingested by the system receives:

- a stable record id
- original absolute source path
- vault storage path
- SHA-256 digest
- byte length
- source kind
- sensitivity label
- ingestion timestamp
- optional extracted text path
- optional extraction handoff path for images, audio, and PDFs
- optional notes

The raw file is the evidence. Extracted text is a convenience layer. Summaries and dossiers must point back to the raw record.

Images, audio, and PDFs receive handoff records when automatic text extraction is unavailable. Those handoffs define the required OCR, transcription, or page-referenced extraction work without weakening the raw-evidence rule.
