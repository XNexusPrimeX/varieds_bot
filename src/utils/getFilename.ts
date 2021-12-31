import path from 'path';

export default function(filename: string) {

    return path.basename(filename).split('.')[0];
}