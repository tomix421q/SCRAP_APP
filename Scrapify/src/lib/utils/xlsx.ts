/** A single cell value; `null` becomes an empty cell. */
export type XlsxCellValue = string | number | boolean | Date | null;

/**
 * Column definition for xlsx export. Kept generic so it can later carry
 * an import mapping (header <-> key) without changing existing callers.
 */
export type XlsxColumn<T> = {
	header: string;
	value: (row: T) => XlsxCellValue;
};
