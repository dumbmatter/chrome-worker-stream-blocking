let cancelRequested = false;

const log = (message) => {
    const formatted = `[worker] ${message}`;
    postMessage(formatted);
}

onmessage = async e => {
    if (e.data.file) {
        log("got file");
        cancelRequested = false;
        processFile(e.data.file);
    } else if (e.data.cancel) {
        log("cancel message received");
        cancelRequested = true;
    }
};

const processFile = async (file) => {
    log("starting decompression");
    let readSize = 0;
    const reader = await file.stream().pipeThrough(
            new TransformStream({
                transform(chunk, controller) {
                    readSize += chunk.length;
                    controller.enqueue(chunk);
                }
            })
        )
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new CompressionStream("gzip"))
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new CompressionStream("gzip")).getReader();

    let readSize2 = 0;
    while (true) {
        const { value, done } = await reader.read();
        readSize2 += value.length;
        if (done) {
            break;
        }

        if (cancelRequested) {
            log("cancelling stream");
            break;
        }

        // This doesn't fix it:
        // await Promise.resolve();

        // This does fix it:
        // await new Promise(resolve => setTimeout(resolve));

        // So does this (but user-blocking priority doesn't):
        // await new Promise(resolve => scheduler.postTask(resolve, { priority: "user-visible" }));
    }

    const percent = Math.round((readSize / file.size) * 100);
    const percent2 = Math.round((readSize2 / file.size) * 100);
    log(`finished (${percent}% done, ${percent2}% done)`);
}
