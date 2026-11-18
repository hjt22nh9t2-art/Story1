"""Claude-API-Anbindung für Themenwahl, Recherche (mit Websuche), Drehbuch und Kritik.

Nutzt das offizielle Anthropic-SDK. Websuche/Web-Abruf laufen serverseitig (keine eigene Suchmaschine nötig).
Ohne ANTHROPIC_API_KEY ist dieses Modul nicht nutzbar – dann übernimmt Claude Code die Text-Schritte
direkt (siehe CLAUDE.md, Abschnitt „Ohne API-Schlüssel“).
"""
import json
import re
import time

from . import config

WEB_TOOLS = [
    {'type': 'web_search_20260209', 'name': 'web_search', 'max_uses': 12},
    {'type': 'web_fetch_20260209', 'name': 'web_fetch', 'max_uses': 8},
]


class LLMNichtVerfuegbar(RuntimeError):
    pass


def verfuegbar():
    return bool(config.env('ANTHROPIC_API_KEY') or config.env('ANTHROPIC_AUTH_TOKEN'))


def _client():
    try:
        import anthropic
    except ImportError as e:
        raise LLMNichtVerfuegbar('Paket „anthropic“ fehlt: pip install -r studio/requirements.txt') from e
    if not verfuegbar():
        raise LLMNichtVerfuegbar('ANTHROPIC_API_KEY ist nicht gesetzt (studio/.env).')
    return anthropic.Anthropic(max_retries=4, timeout=900)


def _stream(client, **kw):
    """Streamt eine Anfrage; nutzt serverseitige Ausweichmodelle bei Ablehnungen, falls das SDK sie kennt."""
    try:
        with client.beta.messages.stream(betas=['server-side-fallback-2026-07-01'], fallbacks='default', **kw) as s:
            return s.get_final_message()
    except TypeError:
        with client.messages.stream(**kw) as s:
            return s.get_final_message()


def fragen(system, prompt, recherche=False, effort='high', max_tokens=32000, versuche=3):
    """Eine Anfrage an Claude. Gibt den Antworttext zurück. recherche=True aktiviert Websuche + Web-Abruf."""
    import anthropic
    client = _client()
    messages = [{'role': 'user', 'content': prompt}]
    kw = dict(model=config.LLM_MODEL, max_tokens=max_tokens, system=system,
              thinking={'type': 'adaptive'}, output_config={'effort': effort})
    if recherche:
        kw['tools'] = WEB_TOOLS
    for v in range(versuche):
        try:
            for _ in range(8):  # pause_turn: lange Server-Tool-Runden fortsetzen
                msg = _stream(client, messages=messages, **kw)
                if msg.stop_reason == 'refusal':
                    raise RuntimeError(f'Anfrage abgelehnt: {getattr(msg, "stop_details", None)}')
                if msg.stop_reason == 'pause_turn':
                    messages = messages + [{'role': 'assistant', 'content': msg.content}]
                    continue
                return ''.join(b.text for b in msg.content if getattr(b, 'type', '') == 'text')
            raise RuntimeError('Zu viele pause_turn-Runden')
        except (anthropic.RateLimitError, anthropic.APIConnectionError, anthropic.InternalServerError) as e:
            warte = 20 * (v + 1)
            print(f'  ! API-Fehler ({type(e).__name__}), neuer Versuch in {warte}s')
            time.sleep(warte)
    raise RuntimeError('Claude-API nach mehreren Versuchen nicht erreichbar')


def json_aus(text):
    """Holt das (letzte) JSON-Objekt aus einer Antwort – mit oder ohne ```json-Block."""
    blocks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.S)
    kandidaten = blocks[::-1] if blocks else []
    if not kandidaten:
        a, b = text.find('{'), text.rfind('}')
        if a >= 0 and b > a:
            kandidaten = [text[a:b + 1]]
    for k in kandidaten:
        try:
            return json.loads(k)
        except json.JSONDecodeError:
            continue
    raise ValueError('Keine gültige JSON-Antwort erhalten:\n' + text[:800])


def fragen_json(system, prompt, **kw):
    for v in range(3):
        txt = fragen(system, prompt if v == 0 else prompt + '\n\nWICHTIG: Antworte AUSSCHLIESSLICH mit gültigem JSON in einem ```json-Block.', **kw)
        try:
            return json_aus(txt)
        except ValueError as e:
            print('  ! JSON ungültig, neuer Versuch:', str(e)[:120])
    raise RuntimeError('Claude lieferte dreimal kein gültiges JSON')
