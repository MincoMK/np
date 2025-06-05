import { IdTable } from "./id-table";
import { IdNet } from "./net";
import { RouteTable } from "./route-table";

export type NCPHandler = (source: string, data: any) => any;

export class NCP {
  private handlers: NCPHandler[] = [];

  public constructor(
    private idTable: IdTable,
    private routeTable: RouteTable,
    private idNet: IdNet,
  ) {}

  public sendRaw(source: string, target: string, data: any) {
    const packet = {
      source,
      target,
      data,
    };

    const via = this.routeTable.resolve(target);
    if (!via)
      throw new Error(
        `Failed to resolve route from ${source} to ${target} at ${this.idTable.getAddress()}`,
      );

    this.idNet.send(via, "ncp.data", packet);
  }

  public send(target: string, data: any) {
    const source = this.idTable.getAddress();
    return this.sendRaw(source, target, data);
  }

  public addHandler(handler: NCPHandler) {
    this.handlers.push(handler);
  }

  public listen() {
    while (true) {
      try {
        const { data } = this.idNet.receive("ncp.data");

        if (data.target == this.idTable.getAddress()) {
          for (const handler of this.handlers) {
            handler(data.source, data.data);
          }
        } else {
          const via = this.routeTable.resolve(data.target);
          if (via) this.idNet.send(via, "ncp.data", data);
          else
            print(
              "DEBUG: Cannot find via from " +
                data.source +
                " to " +
                data.target +
                " at " +
                this.idTable.getAddress(),
            );
        }
      } catch (e) {
        print(e);
      }
    }
  }
}
