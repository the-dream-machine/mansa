import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';

interface Args {
	filePath: string;
}

export const createChecksum = async ({filePath}: Args) => {
	try {
		const hash = createHash('md5');
		const stream = createReadStream(filePath);

		for await (const data of stream) {
			hash.update(data as string);
		}

		const md5Checksum = hash.digest('hex');
		return md5Checksum;
	} catch (error) {
		throw error;
	}
};
