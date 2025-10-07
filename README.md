# chrome-worker-stream-message

To reproduce the issue:

1. Go to https://dumbmatter.github.io/chrome-worker-stream-blocking/
2. Select a large (>500MB) gzip file
   (Running `head -c 500M /dev/random | base64 | gzip -c > test.gz` will create one)
3. Once it starts decompressing, click "Cancel"

Here's what happens in some browsers:

Firefox 143: the "cancel" message is almost instantly received by the worker and the stream almost immediately stops.

Chrome 141: the "cancel" message is not received by the worker until the stream has already finished processing, no matter how long that takes.

Safari 26: usually behaves the same as Chrome, but sometimes behaves like Firefox (but a bit less responsive).

I'm not sure which of these behaviors is most correct. Regardless, it's weird Firefox and Chrome/Safari are so different.

If you add `await Promise.resolve();` inside the loop consuming the stream, that still doesn't fix Chrome's behavior. But if you add `await new Promise(resolve => setTimeout(resolve));` or `await new Promise(resolve => scheduler.postTask(resolve, { priority: "user-visible" }));` then Chrome behaves like Firefox.
