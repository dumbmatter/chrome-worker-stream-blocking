# chrome-worker-stream-message

To reproduce the issue:

1. Go to https://dumbmatter.github.io/chrome-worker-stream-blocking/
2. Select a large (>500MB) gzip file
   (Running `head -c 500M /dev/random | base64 | gzip -c > test.gz` will create one)
3. Once it starts decompressing, click "Cancel"
4. Observe that in Chrome 141 the worker does not get the "cancel" message until the stream has is done processing, but in Firefox 143 it does get it during the stream and cancels it before it reaches 100%

I'm not sure whether Chrome or Firefox is behaving correctly, but I suspect Firefox.

If you add `await Promise.resolve();` inside the loop consuming the stream, that still doesn't fix it.

But if you add `await new Promise(resolve => setTimeout(resolve));` then Chrome behaves like Firefox.
