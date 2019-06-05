import { FETCH_BOOKS } from '../actions/types';
import { OptionType } from '../components/ReactSelect';
import { BookName, IBookNameData, BookNameMap } from '../model';

const initialState = {
	"loaded": false,
	"suggestions": Array<OptionType>(),
	"map": {},
};

const makeMap = (books: BookName[]) => {
	let result: BookNameMap = {};
	books.filter((b: BookName) => b.short !== '')
		.forEach(b => {
			result[b.code] = b.short;
		})
	return result;
}

export default function (state = initialState, action: any): IBookNameData {
	switch (action.type) {
		case FETCH_BOOKS:
			return {
				...state,
				"loaded": true,
				"suggestions": action.payload.data
					.filter((b: BookName) => b.short !== '')
					.map((b: BookName) => {
						return {value: b.code, label: b.short}
					}),
				"map": makeMap(action.payload.data),
			};
		default:
			return state;
	}
}
