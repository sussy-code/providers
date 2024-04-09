export interface Episode {
    episode: string;
    id: number;
    videoKey: string;
    hls: string;
    audio: {
        names: [];
        order: [];
    }
    cc: []
    duration: number;
    title: string;
    download: string;
    sections: []
    poster: string;
    preview: {
        src: string;
    }
}

export interface Subtitle {
    url: string;
    name: string;
}

export interface Season {
    season: number,
    blocked: boolean,
    episodes: Episode[]
}