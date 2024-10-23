export const equals = (one: [number, number], two: [number, number]) => {
	return one.every((val, index) => val === two[index]);
};
