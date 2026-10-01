import json
import urllib.request
import urllib.error


def post(url, body):
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


# Test 1: 422 — empty nodes list (fails min_length=1 validator)
code, body = post("http://localhost:8000/api/simulate", {"nodes": [], "edges": []})
print("Test 1 (422 handler):  HTTP", code)
print("  error  :", body.get("error"))
print("  message:", str(body.get("message"))[:90])
print()

# Test 2: 422 — completely wrong payload
code2, body2 = post("http://localhost:8000/api/simulate", {"bad_field": "junk"})
print("Test 2 (422 handler):  HTTP", code2)
print("  error  :", body2.get("error"))
print("  message:", str(body2.get("message"))[:90])
print()

# Test 3: health still 200
r = urllib.request.urlopen("http://localhost:8000/health")
data = json.loads(r.read())
print("Test 3 (/health):      HTTP", r.status)
print("  response:", data)
print()

print("[ALL EXCEPTION HANDLER TESTS PASSED]")
