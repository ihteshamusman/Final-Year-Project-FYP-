import httpx, json, asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')

async def test():
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post('http://localhost:8000/ask-agent', json={
            'question': 'What is the employment rate for Business Analytics?',
            'role': 'admin',
            'user_name': 'Admin'
        })
        d = r.json()
        print(f"STATUS: {r.status_code}")
        print(f"REASONING: {d.get('reasoning', [])}")
        print(f"DATA SOURCES: {d.get('data_sources', [])}")
        print(f"\nANSWER (first 800 chars):\n{d.get('answer', '')[:800]}")

asyncio.run(test())
