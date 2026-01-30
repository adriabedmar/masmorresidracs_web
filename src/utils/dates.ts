/**
 * Parse date from 'DD MM YYYY' format or fallback to standard parsing
 */
export const parseDate = (str: string): Date => {
	const match = str.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
	if (match) {
		const [, day, month, year] = match;
		return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
	}
	return new Date(str);
};

/**
 * Format date to 'DD MM YYYY' string
 */
export const formatDateString = (date: Date): string => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
};
