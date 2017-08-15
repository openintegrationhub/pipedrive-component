export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class StatusResultError {
    constructor(public message: string) { }
}

export interface TokenResult {
    StatusToken: number;
}

export interface StatusResult {
    Status: string;
    Message: string;
}