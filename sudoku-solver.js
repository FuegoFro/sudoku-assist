const initVals = ["7", "1", "4", "8", "9", "3", "2", "6", "5", "2", "6", "9", "1", "5", "4", "", "", "", "5", "8", "3", "6", "7", "2", "9", "4", "1", "1", "", "6", "4", "", "", "", "", "", "9", "7", "8", "", "", "", "", "", "", "4", "", "5", "", "", "", "", "", "", "6", "", "2", "", "3", "1", "4", "8", "9", "8", "", "1", "9", "6", "", "3", "", "", "3", "9", "7", "2", "4", "8", "5", "1", "6"];

const SUDOKU_CELL_ID_PREFIX = 'sudoku-';
const EXTRA_INVALID_CELL_ID_PREFIX = 'extra-invalid-';

const cellIdForCoords = (cellIdPrefix, x, y) => {
    return `#${cellIdPrefix}cell-${x}-${y}`;
};

const getExtraInvalidValueAt = (x, y) => {
    return $(cellIdForCoords(EXTRA_INVALID_CELL_ID_PREFIX, x, y)).val();
};

const getBoardValueAt = (x, y) => {
    return $(cellIdForCoords(SUDOKU_CELL_ID_PREFIX, x, y)).val();
};

const setBoardPlaceholderAt = (x, y, val) => {
    $(cellIdForCoords(SUDOKU_CELL_ID_PREFIX, x, y)).attr('placeholder', val);
};

function handleInvalidNumbersInBoard(x, y, invalidNumbers) {
    const currentValue = getBoardValueAt(x, y);
    const currentCell = $(cellIdForCoords(SUDOKU_CELL_ID_PREFIX, x, y));
    if (currentValue !== '') {
        setBoardPlaceholderAt(x, y, '');

        if (invalidNumbers.has(currentValue)) {
            currentCell.addClass('error');
        } else {
            currentCell.removeClass('error');
        }
    } else {
        currentCell.removeClass('error');

        for (let extraInvalid of getExtraInvalidValueAt(x, y)) {
            invalidNumbers.add(extraInvalid);
        }

        let validNumbersStr = '';
        for (let num = 1; num <= 9; num++) {
            const numStr = num.toString();
            if (!invalidNumbers.has(numStr)) {
                validNumbersStr += numStr;

            }
        }
        setBoardPlaceholderAt(x, y, validNumbersStr);
    }
}

const updateGrid = (getter, cellCallback) => {
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            let invalidNumbers = new Set();
            const markAsInvalid = (markedX, markedY) => {
                if (x === markedX && y === markedY) {
                    return
                }
                const val = getter(markedX, markedY);
                if (val !== '') {
                    invalidNumbers.add(val);
                }
            };

            // Block
            const blockStartX = x - (x % 3);
            const blockStartY = y - (y % 3);
            for (let blockOffsetX = 0; blockOffsetX < 3; blockOffsetX++) {
                for (let blockOffsetY = 0; blockOffsetY < 3; blockOffsetY++) {
                    markAsInvalid(blockStartX + blockOffsetX, blockStartY + blockOffsetY);
                }
            }
            // Row
            for (let rowX = 0; rowX < 9; rowX++) {
                markAsInvalid(rowX, y);
            }
            // Column
            for (let colY = 0; colY < 9; colY++) {
                markAsInvalid(x, colY);
            }

            cellCallback(x, y, invalidNumbers);

        }
    }
};

function convertBoardToArray() {
    let copyOfBoard = [];
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            copyOfBoard.push(getBoardValueAt(x, y));
        }
    }
    return copyOfBoard;
}

function isSimpleToSolve() {
    // copy of board in memory
    let copyOfBoard = convertBoardToArray();

    function getValueAtFromCopy(x, y) {
        return copyOfBoard[y * 9 + x];
    }

    function setValue(x, y, value) {
        copyOfBoard[y * 9 + x] = value;
    }

    let didShit = true;

    function handleInvalid(x, y, invalidNumbers) {
        if (getValueAtFromCopy(x, y) !== '') {
            return;
        }
        let validNumbers = [];
        for (let num = 1; num <= 9; num++) {
            const numStr = num.toString();
            if (!invalidNumbers.has(numStr)) {
                validNumbers.push(numStr);
            }
        }
        if (validNumbers.length === 1) {
            setValue(x, y, validNumbers[0]);
            didShit = true;
        }
    }

    while (didShit) {
        didShit = false;
        updateGrid(getValueAtFromCopy, handleInvalid);
    }

    return !copyOfBoard.includes('');
}

const handleBoardChanged = () => {
    updateGrid(getBoardValueAt, handleInvalidNumbersInBoard);
    if (isSimpleToSolve()) {
        $('input').addClass('hidden');
    } else {
        $('input').removeClass('hidden');
    }
};

function createTable(tableId, cellIdPrefix, attrs = '') {
    const table = $(tableId);
    for (let y = 0; y < 9; y++) {
        let needsTppBorder = y % 3 === 0 ? ' top-border' : '';
        let tr = $('<tr></tr>');
        for (let x = 0; x < 9; x++) {
            let needsLeftBorder = x % 3 === 0 ? ' left-border' : '';
            tr.append($(`<td><input id="${cellIdForCoords(cellIdPrefix, x, y).substring(1)}" class="cell${needsLeftBorder}${needsTppBorder}" ${attrs}/></td>`));
        }
        table.append(tr);
    }
}

function getNextCellCoords(x, y) {
    if (x < 8) {
        x++;
    } else if (y < 8) {
        x = 0;
        y++;
    } else {
        x = 0;
        y = 0;
    }
    return {x, y};
}

$(document).ready(() => {
    createTable('#sudoku-table', SUDOKU_CELL_ID_PREFIX, 'maxlength="1"');
    createTable('#extra-invalid-table', EXTRA_INVALID_CELL_ID_PREFIX);

    $('#sudoku-table .cell').keydown(function (e) {
        let id = $(e.currentTarget).attr('id');
        let match = /(.*)cell-(\d)-(\d)/.exec(id);
        let prefix = match[1];
        let x = parseInt(match[2]);
        let y = parseInt(match[3]);
        if (e.key === "ArrowDown") {
            if (y < 8) {
                y++;
            } else {
                y = 0;
            }
        } else if (e.key === 'ArrowUp') {
            if (y > 0) {
                y--;
            } else {
                y = 8;
            }
        } else if (e.key === 'ArrowLeft') {
            if (x > 0) {
                x--;
            } else {
                x = 8;
            }
        } else if (e.key === 'ArrowRight') {
            if (x < 8) {
                x++;
            } else {
                x = 0;
            }
        } else if (e.key === 'Backspace') {
            const cell = $(cellIdForCoords(prefix, x, y));
            console.log(cell.val());
            const wasEmpty = cell.val() === '';
            cell.val('');
            if (wasEmpty) {
                if (x > 0) {
                    x--;
                } else if (y > 0) {
                    x = 8;
                    y--;
                } else {
                    x = 8;
                    y = 8;
                }
            }
            handleBoardChanged();
        } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
            $(cellIdForCoords(prefix, x, y)).val(e.key);
            const coords = getNextCellCoords(x, y);
            x = coords.x;
            y = coords.y;
            handleBoardChanged();
        } else if (e.key === " ") {
            const coords = getNextCellCoords(x, y);
            x = coords.x;
            y = coords.y;
            e.preventDefault();
        } else if (e.key === "Tab") {
            return;
        } else {
            console.log(e);
            if (!e.metaKey) {
                e.preventDefault();
            }
            return;
        }

        setTimeout(() => $(cellIdForCoords(prefix, x, y)).focus());

    });

    $('#extra-invalid-table .cell').keydown(function (e) {
        handleBoardChanged();
    });


    $('#save-board-state-button').click(() => console.log(convertBoardToArray()));

    // let initValueIndex = 0;
    // for (let y = 0; y < 9; y++) {
    //     for (let x = 0; x < 9; x++) {
    //         $(cellIdForCoords(SUDOKU_CELL_ID_PREFIX, x, y)).val(initVals[initValueIndex]);
    //         initValueIndex++;
    //     }
    // }

    handleBoardChanged();
});
