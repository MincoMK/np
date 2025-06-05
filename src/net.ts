import { IdTable } from "./id-table";

export class IdNet {
  public constructor(private idTable: IdTable) {}

  public send(peerAddr: string, protocol: string, data: rednet.RednetData) {
    const id = this.idTable.resolve(peerAddr);
    if (!id) throw new Error("Failed to resolve ID: " + id);

    rednet.send(id, data, protocol);
  }

  public receive(
    protocol: string,
    timeout?: number,
  ): { address: string; id: number; data: rednet.RednetData } {
    const [id, data] = rednet.receive(protocol, timeout);
    const address = this.idTable.reverseResolve(id);
    if (!address) throw new Error("Failed to resolve address: " + address);

    return { address, id, data };
  }
}
