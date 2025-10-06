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
    const decompressedStream = file.stream().pipeThrough(
		new TransformStream({
			transform(chunk, controller) {
				readSize += chunk.length;
				controller.enqueue(chunk);
			}
		})
	).pipeThrough(new DecompressionStream("gzip"));

    for await (const value of decompressedStream) {
        if (cancelRequested) {
            log("cancelling stream");
            break;
        }

        // This doesn't fix it:
        // await Promise.resolve();

        // This does fix it:
        // await new Promise(resolve => setTimeout(resolve));

        // So does this (but user-visible priority doesn't):
        // await new Promise(resolve => scheduler.postTask(resolve, { priority: "user-visible" }));
    }

    const percent = Math.round((readSize / file.size) * 100);
    log(`finished (${percent}% done)`);
}
