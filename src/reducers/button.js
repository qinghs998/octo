/**
 * @since 2016-07-31 18:40
 * @author vivaxy
 */

import createReducer from '../lib/createReducer';

import * as constant from '../config/actions';

const defaultState = true;

export default createReducer(defaultState, {
    [constant.BUTTON_DISABLED]: () => {
        return false;
    },
    [constant.BUTTON_DEFAULT]: () => {
        return true;
    },
});
