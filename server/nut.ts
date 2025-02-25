import { Socket } from 'net';
import PromiseSocket from './promise-socket';

export class Nut {
  private socket: PromiseSocket;
  private host: string;
  private port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
    this.socket = new PromiseSocket(new Socket());
  }

  private async getCommand(command: string) {
    await this.socket.write(command);
    const data = await this.socket.readAll(command);
    return data;
  }

  public async connect() {
    await this.socket.connect(this.port, this.host);
  }

  public async close() {
    await this.socket.write('LOGOUT');
    await this.socket.close();
  }

  public async getDevices() {
    const command = 'LIST UPS';
    let data = await this.getCommand(command);
    data = data.replace('BEGIN ' + command, '');
    data = data.replace('END ' + command + '\n', '');
    data = data.replace(/"/g, '');
    const devices = data.trim().split('\n');
    return devices.map((device) => device.split(' ')[1]);
  }

  public async getData(device = 'UPS') {
    const command = `LIST VAR ${device}`;
    let data = await this.getCommand(command);
    data = data.replace('BEGIN ' + command, '');
    data = data.replace('END ' + command + '\n', '');
    const regex = new RegExp(`VAR ${device} `, 'g');
    data = data.replace(regex, '');
    data = data.replace(/"/g, '');
    const props = data.trim().split('\n');
    const values: any = {};
    props.forEach((prop) => {
      const key = prop.substring(0, prop.indexOf(' ')).replace(/\./g, '_');
      const value = prop.substring(prop.indexOf(' ') + 1);
      values[key] = value;
    });
    return values;
  }
}
