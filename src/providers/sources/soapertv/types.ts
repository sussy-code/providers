export interface Subtitle {
  path: string;
  name: string;
}

export interface InfoResponse {
  key: boolean;
  val: string;
  vtt: string;
  val_bak: string;
  pos: number;
  type: string;
  subs: Subtitle[];
  ip: string;
}
