import { EventEmitter } from 'https://deno.land/std@0.90.0/node/events.ts';
import { iterateReader } from "https://deno.land/std@0.166.0/streams/mod.ts";

export class JSONStream extends EventEmitter {
  private openBraceCount = 0;
  private tempUint8Array: number[] = [];
  private decoder = new TextDecoder();
  private buffer: object[] = [];
  private stop = false;

  constructor(private filepath: string, private batchSize = 0) {
    super();
    this.stream();
  }

  // Taken from  https://stackoverflow.com/questions/58070346/reading-large-json-file-in-deno
  // Modified to emit batches
  async stream() {
    let file = await Deno.open(this.filepath);
    //creates iterator from reader, default buffer size is 32kb
    for await (const buffer of iterateReader(file)) {
      for (let i = 0, len = buffer.length; i < len; i++) {
        const uint8 = buffer[i];

        //open brace
        if (uint8 === 123) {
          if (this.openBraceCount === 0) this.tempUint8Array = [];
          this.openBraceCount++;
        }

        this.tempUint8Array.push(uint8);

        //close brace
        if (uint8 === 125) {
          this.openBraceCount--;
          if (this.openBraceCount === 0) {
            const uint8Ary = new Uint8Array(this.tempUint8Array);
            const jsonString = this.decoder.decode(uint8Ary);
            const object = JSON.parse(jsonString);
            this.emit('object', object);

            if (this.batchSize > 0) {
              this.buffer.push(object);
              if (this.buffer.length === this.batchSize) {
                this.emit('batch', this.buffer);
                this.buffer = [];
              }
            }
          }
        }
        if(this.stop){
          break;
        }
      }
      if(this.stop){
        break;
      }
    }
    file.close();
    if (this.buffer.length > 0) {
      this.emit('batch', this.buffer);
    }
    this.emit('end');
  }

  stopStream() {
    this.stop = true;
  }
}
