export function unique<T>(arr: T[], key: keyof T): T[] {
	const seen = new Set();
	return arr.filter((item) => {
		const k = item[key];
		return seen.has(k) ? false : seen.add(k);
	});
}
