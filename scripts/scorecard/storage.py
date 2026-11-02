"""Small DB-API contract shared by SQLite fixtures and optional psycopg Postgres."""
import json
import pathlib
import sqlite3

ROOT = pathlib.Path(__file__).resolve().parents[2]
CONFIG = json.loads((ROOT / 'config/scorecard-allowlist.json').read_text())
TABLES = ('gh_pr', 'gh_review', 'gh_check_run', 'gh_commit_pr', 'gh_revert_link',
          'sc_pr_attribution', 'sc_daily_metrics')


def connect(path):
    if path.startswith(('postgresql://', 'postgres://')):
        import psycopg
        db = psycopg.connect(path)
        db.execute('SET search_path TO scorecard')
        return db
    db = sqlite3.connect(path)
    for table in TABLES:
        extra = ", binding_quality TEXT NOT NULL CHECK(binding_quality IN ('canonical','correlated','source-only','unbound'))" if table.startswith('sc_') else ''
        db.execute(f'CREATE TABLE IF NOT EXISTS {table} (id TEXT PRIMARY KEY, repo TEXT NOT NULL, body TEXT NOT NULL{extra})')
    return db


def put(db, table, key, repo, body, quality=None):
    if repo not in CONFIG['repositories']:
        raise ValueError('Repository not allowlisted')
    columns = 'id,repo,body' + (',binding_quality' if quality else '')
    values = [key, repo, json.dumps(body)] + ([quality] if quality else [])
    marker = '?' if isinstance(db, sqlite3.Connection) else '%s'
    db.execute(f'INSERT INTO {table} ({columns}) VALUES ({",".join([marker]*len(values))}) ON CONFLICT(id) DO UPDATE SET repo=excluded.repo,body=excluded.body' + (',binding_quality=excluded.binding_quality' if quality else ''), values)


def rows(db, table):
    result = []
    for (body,) in db.execute(f'SELECT body FROM {table} ORDER BY id').fetchall():
        value = json.loads(body) if isinstance(body, str) else body
        if value.get('repo') in CONFIG['repositories']:
            result.append(value)
    return result
