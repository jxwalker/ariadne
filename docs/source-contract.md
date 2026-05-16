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
- optional extraction result path list
- optional extraction handoff path for images, audio, and PDFs
- optional extraction runner plan records for tool and host selection
- optional extraction result records for OCR, transcription, PDF text, or visual descriptions
- optional notes

The raw file is the evidence. Extracted text is a convenience layer. Summaries and dossiers must point back to the raw record.

Images, audio, and PDFs receive handoff records when automatic text extraction is unavailable. Those handoffs define the required OCR, transcription, or page-referenced extraction work without weakening the raw-evidence rule.

`extraction-plan` records the tool, host, runner type, planned output path, constraints, and follow-up import command before a live OCR, transcription, or PDF extraction tool is run. It is selection evidence, not execution authority.

`extraction-import` attaches externally produced text back to the original source record. It writes a unique `raw/<record-id>/extracted-<extraction-id>.md`, updates the manifest entry, and stores companion JSON/Markdown evidence under `extractions/`. The latest import is used as the source record's `extractedTextPath`, and all imported text paths remain listed in `extractionResultPaths`. The extraction result records the source record id, extraction kind, tool name, optional confidence, and notes so later dossiers can use the text without losing the raw-evidence chain.

Text-bearing sources are scanned for common secret patterns before vault promotion. High-severity findings block ingestion unless the operator explicitly passes `--allow-secret-findings`; even then, the hygiene report is stored beside the raw artifact.
