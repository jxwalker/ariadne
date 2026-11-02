"""Explicit source hints only. Trailer and label keys ignore case; source IDs do not."""
import re


def trailers(message):
    paragraphs = message.rstrip().split('\n\n')
    if len(paragraphs) < 2 or not paragraphs[0].strip():
        return []
    paragraph = paragraphs[-1]
    lines = paragraph.splitlines()
    # A trailer block contains only trailer entries (and folded continuations).
    if not lines or not all(re.match(r'^[A-Za-z0-9-]+\s*:', line) or
                            (i > 0 and line.startswith((' ', '\t')))
                            for i, line in enumerate(lines)):
        return []
    unfolded = []
    for line in lines:
        if line.startswith((' ', '\t')) and unfolded:
            unfolded[-1] += ' ' + line.strip()
        else:
            unfolded.append(line)
    return [m.group(1).strip() for line in unfolded
            if (m := re.match(r'^bot\s*:\s*(.*)$', line, re.I))]


def attribute(messages, labels, known):
    values = [v for message in messages for v in trailers(message)]
    values += [label[4:] for label in labels if label[:4].lower() == 'bot:']
    unique = set(values)
    if len(unique) > 1:
        return 'unattributed', 'unbound', 'conflict'
    if not unique or next(iter(unique)) not in known:
        return 'unattributed', 'unbound', 'unknown' if unique else 'missing'
    return next(iter(unique)), 'source-only', 'explicit hint'
