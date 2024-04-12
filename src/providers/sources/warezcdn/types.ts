interface Data {
  id: string;
  audio: string;
  mixdropStatus: string;
  fembedStatus: string;
  streamtapeStatus: string;
  warezcdnStatus: string;
}

type List = {
  [key: string]: Data;
};

export interface SerieAjaxResponse {
  list: List;
}
