import { IdTable } from "./id-table";
import { NCP } from "./ncp";
import { IdNet } from "./net";
import { NGP } from "./ngp";
import { RouteTable } from "./route-table";

export class NP {
  private idTable: IdTable;
  private ngp: NGP;
  private ncp: NCP;

  public constructor(address: string) {
    this.idTable = new IdTable(address);
    const routeTable = new RouteTable();
    const net = new IdNet(this.idTable);
    this.ngp = new NGP(this.idTable, routeTable, net);
    this.ncp = new NCP(this.idTable, routeTable, net);
  }

  public announceOnline() {
    this.ngp.announceOnline();
  }

  public addPeer(p: string) {
    this.ngp.addPeer(p);
    return this;
  }

  public addDataHandler(handler: (source: string, data: any) => any) {
    this.ncp.addHandler(handler);
    return this;
  }

  public listen() {
    parallel.waitForAll(
      () => this.ngp.listen(),
      () => this.ncp.listen(),
      () => this.idTable.listen(),
    );
  }

  public run() {
    this.announceOnline();
    this.listen();
  }

  public runWith(fn: (...args: any) => any) {
    parallel.waitForAny(fn, () => this.run());
  }

  public send(target: string, data: any) {
    this.ncp.send(target, data);
  }

  public flushResolver() {
    this.idTable.flush();
  }
}
