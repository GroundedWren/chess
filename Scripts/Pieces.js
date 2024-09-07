/**
 * @file Code for chess pieces
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Pieces(ns) {
	const ORDERED_FILES = GW.Chessboard.ORDERED_FILES;
	const ORDERED_RANKS = GW.Chessboard.ORDERED_RANKS;
	const RANK_ORDER_INDEX = GW.Chessboard.RANK_ORDER_INDEX;
	const FILE_ORDER_INDEX = GW.Chessboard.FILE_ORDER_INDEX;

	/**
	 * Determines whether a team is in check
	 * @param {Object} boardSnap Snapshot of the current board
	 * @param {string} color Team color to check
	 * @returns boolean
	 */
	ns.isTeamInCheck = function isTeamInCheck(boardSnap, color) {
		const king = Object.values(boardSnap).filter(
			piece => piece.Name === "King" && piece.Color === color
		)[0];
		return Object.values(boardSnap).reduce((inCheck, piece) => {
			piece.DisableCheckCheck = true;
			if(piece.Color !== color && piece.canCapture(boardSnap, king.File, king.Rank)) {
				inCheck = true;
			}
			piece.DisableCheckCheck = false;
			return inCheck;
		}, false);
	}

	/**
	 * Determines whether a team is in checkmate
	 * @param {Object} boardSnap Snapshot of the current board
	 * @param {string} color Team color to check
	 * @returns boolean
	 */
	ns.isTeamInCheckmate = function isTeamInCheckmate(boardSnap, color) {
		return !Object.values(boardSnap).find(
			piece => piece.Color === color && piece.getMoves(boardSnap).length
		)
	}

	/**
	 * Turns a piece name into an abbreviation
	 * @param {string} name Piece name
	 * @returns string
	 */
	ns.getPieceAbbrFromName = function getPieceAbbrFromName(name) {
		if(ns[name]) {
			return new ns[name]().Abbr;
		}
		return "";
	}

	/**
	 * Turns a piece abbreviation into a full name
	 * @param {string} abbr Piece abbreviation
	 * @returns string
	 */
	ns.getPieceNameFromAbbr = function getPieceNameFromAbbr(abbr) {
		switch(abbr) {
			case "": {
				return "Pawn";
			}
			case "R": {
				return "Rook";
			}
			case "N": {
				return "Knight";
			}
			case "B": {
				return "Bishop";
			}
			case "Q": {
				return "Queen";
			}
			case "K": {
				return "King";
			}
		}
	}

	//#region Piece
	ns.Piece = class Piece {
		Color;
		StartFile;
		StartRank;

		File;
		Rank;
		MoveCount;

		DisableCheckCheck; //Whether to temporarily exempt this piece from in-check calculations

		/**
		 * Creates the piece
		 * @param {string} color Team color
		 * @param {string} startFile File the piece was placed onto the board
		 * @param {string} startRank Rank the piece was placed onto the board
		 */
		constructor(color, startFile, startRank) {
			this.Color = color;
			this.StartFile = startFile;
			this.StartRank = startRank;

			this.File = startFile;
			this.Rank = startRank;

			this.MoveCount = 0;

			this.DisableCheckCheck = false;
		}

		/**
		 * Full name of the piece
		 */
		get Name() {
			throw new Error("Name is not implemented");
		}

		/**
		 * Piece abbreviation for algebraic notation
		 */
		get Abbr() {
			throw new Error("Abbr is not implemented");
		}

		/**
		 * Key to a <gw-icon> for this piece
		 */
		get IconKey() {
			throw new Error("IconKey is not implemented");
		}

		/**
		 * Piece value
		 */
		get Value() {
			throw new Error("Value is not implemented");
		}

		/**
		 * CSS class to determine which way the icon will face
		 */
		get FlipClass() {
			return "";
		}

		/**
		 * String of a <gw-icon> element for this piece
		 */
		get Icon() {
			return `<gw-icon
				iconKey="${this.IconKey}"
				name="${this.Color} ${this.Name}"
				iconClasses="${this.Color} ${this.FlipClass}"
				class="piece"
			></gw-icon>`
		}

		/**
		 * Duplicates the piece
		 * @returns Piece
		 */
		clone() {
			const clone = new ns[this.Name](this.Color, this.StartFile, this.StartRank);
			clone.File = this.File;
			clone.Rank = this.Rank;
			clone.MoveCount = this.MoveCount;
			return clone;
		}

		/**
		 * Updates the piece's understanding of where it is on the board
		 * @param {string} file 
		 * @param {string} rank 
		 */
		moveTo(file, rank) {
			this.Rank = rank;
			this.File = file;
			this.MoveCount++;
		}

		/**
		 * Computes all legal moves
		 * @param {Object} _boardSnap Board snapshot
		 * @returns Array of moves
		 */
		getMoves(_boardSnap) {
			throw new Error("getMoves is not implemented");
		}

		/**
		 * Determines whether a specified move is legal
		 * @param {Object} boardSnap Board snapshot
		 * @param {string} file Test destination cell file
		 * @param {string} rank Test destination cell rank
		 * @returns boolean
		 */
		isValidMove(boardSnap, file, rank) {
			const move = this.getMoves(boardSnap).filter(
				move => move.Cell[0] === file && move.Cell[1] === rank
			)[0];

			return !!move;
		}

		/**
		 * Determines whether the piece at the specified cell can be captured
		 * @param {Object} boardSnap Board snapshot
		 * @param {string} file Test target cell file
		 * @param {string} rank Test target cell rank
		 * @returns boolean
		 */
		canCapture(boardSnap, file, rank) {
			const move = this.getMoves(boardSnap).filter(
				move => move.Capture && move.Capture[0] === file && move.Capture[1] === rank
			)[0];

			return !!move;
		}

		/**
		 * Gets all valid moves in a specified line
		 * @param {Object} boardSnap Board snapshot
		 * @param {number} fileStep Delta x
		 * @param {number} rankStep Delta y
		 * @returns Array of moves
		 */
		getStandardLineMoves(boardSnap, fileStep, rankStep) {
			const moves = [];

			const {Cells: lineCells, Blocked: lineBlocked} = getLineUntilBlocked(
				boardSnap,
				this.File,
				this.Rank,
				fileStep,
				rankStep
			);
			moves.push(...(lineCells.map(cell => { return {Cell: cell, Capture: null} })));

			if(lineBlocked && lineCells.length) {
				const blockedCell = moves[moves.length - 1].Cell;
				if(boardSnap[blockedCell].Color !== this.Color) {
					moves[moves.length - 1].Capture = moves[moves.length - 1].Cell
				}
				else {
					moves.pop();
				}
			}
			
			return moves;
		}

		/**
		 * Given the array of pieces found trying to move to the destination, is the destination a valid move
		 * @param {Object} boardSnap Board snapshot
		 * @param {Array} pieces Pieces found along the checked line
		 * @param {string} file Destination file
		 * @param {string} rank Destination rank
		 * @returns boolean
		 */
		isStandardValidLineMove(boardSnap, pieces, file, rank) {
			const checkCell = `${file}${rank}`;

			if(Object.keys(pieces).length === 1) {
				return !this.moveCausesTeamCheck(boardSnap, {Cell: checkCell, Capture: null});
			}
			if(Object.keys(pieces).length === 2 && pieces[checkCell] && boardSnap[checkCell].Color !== this.Color) {
				return !this.moveCausesTeamCheck(boardSnap, {Cell: checkCell, Capture: checkCell});
			}

			return false;
		}

		/**
		 * Filters down an array of proposed moves to those that don't cause check for the piece's team
		 * @param {Object} boardSnap Board snapshot
		 * @param {Array} moves Proposed moves
		 * @returns Array of valid moves
		 */
		filterByTeamCheck(boardSnap, moves) {
			if(this.DisableCheckCheck) {
				return moves;
			}
			return moves.filter(move => !this.moveCausesTeamCheck(boardSnap, move));
		}

		/**
		 * Determines whether a move will place the piece's team in check
		 * @param {Object} boardSnap Board snapshot
		 * @param {Object} move Move description
		 * @returns boolean
		 */
		moveCausesTeamCheck(boardSnap, move) {
			if(this.DisableCheckCheck) {
				return false;
			}
			
			const simulation = GW.Chessboard.Snapshots.cloneSnapshot(boardSnap);
			GW.Chessboard.Snapshots.applyMove(simulation, `${this.File}${this.Rank}`, move);
			return ns.isTeamInCheck(simulation, this.Color);
		}
	}
	//#endregion

	//#region Pawn
	ns.Pawn = class Pawn extends ns.Piece {
		EnPassantable = false; //Not part of clone

		get Name() {
			return "Pawn";
		}
		get Abbr() {
			return "";
		}
		get IconKey() {
			return "chess-pawn";
		}
		get Value() {
			return 1;
		}

		moveTo(file, rank) {
			if(Math.abs(rank - this.Rank) === 2) {
				this.EnPassantable = true;
			}
			else {
				this.EnPassantable = false;
			}
			super.moveTo(file, rank);
		}

		getMoves(boardSnap) {
			const moves = [];

			const dir = this.Color === "white" ? -1 : 1;

			const rankOneUp = GW.Chessboard.getRank(this.Rank, dir);
			const cellOneUp = `${this.File}${rankOneUp}`;
			if(!boardSnap[cellOneUp]) {
				moves.push({ Cell: cellOneUp, Capture: null });
			}

			const cellTwoUp = `${this.File}${GW.Chessboard.getRank(this.Rank, dir*2)}`;
			if(!this.MoveCount && !boardSnap[cellOneUp] && !boardSnap[cellTwoUp]) {
				moves.push({Cell: cellTwoUp, Capture: null});
			}

			const cellLeftDiag = `${GW.Chessboard.getFile(this.File, -1)}${GW.Chessboard.getRank(this.Rank, dir)}`;
			const cellRightDiag = `${GW.Chessboard.getFile(this.File, 1)}${GW.Chessboard.getRank(this.Rank, dir)}`;
			const cellLeft = `${GW.Chessboard.getFile(this.File, -1)}${this.Rank}`;
			const cellRight = `${GW.Chessboard.getFile(this.File, 1)}${this.Rank}`;

			if(boardSnap[cellLeftDiag] && boardSnap[cellLeftDiag].Color !== this.Color) {
				moves.push({Cell: cellLeftDiag, Capture: cellLeftDiag});
			}
			if(boardSnap[cellRightDiag] && boardSnap[cellRightDiag].Color !== this.Color) {
				moves.push({Cell: cellRightDiag, Capture: cellRightDiag});
			}

			// on croissant
			if(boardSnap[cellLeft]?.Color !== this.Color && boardSnap[cellLeft]?.EnPassantable) {
				moves.push({Cell: cellLeftDiag, Capture: cellLeft});
			}
			if(boardSnap[cellRight]?.Color !== this.Color && boardSnap[cellRight]?.EnPassantable) {
				moves.push({Cell: cellRightDiag, Capture: cellRight});
			}

			moves.forEach(move => {
				const moveRankIdx = RANK_ORDER_INDEX[move.Cell[1]];
				move.Promotion = moveRankIdx === 0 || moveRankIdx === (ORDERED_RANKS.length - 1)
			});

			return this.filterByTeamCheck(boardSnap, moves);
		}
	}
	//#endregion

	//#region Rook
	ns.Rook = class Rook extends ns.Piece {
		static LineCombos = [
			{fileStep: 1, rankStep: 0},
			{fileStep: -1, rankStep: 0},
			{fileStep: 0, rankStep: 1},
			{fileStep: 0, rankStep: -1},
		];

		get Name() {
			return "Rook";
		}
		get Abbr() {
			return "R";
		}
		get IconKey() {
			return "chess-rook";
		}
		get Value() {
			return 5;
		}

		getMoves(boardSnap) {
			const moves = [];
			ns.Rook.LineCombos.forEach(lineSpec => {
				moves.push(...this.getStandardLineMoves(boardSnap, lineSpec.fileStep, lineSpec.rankStep));
			});
			return this.filterByTeamCheck(boardSnap, moves);
		}

		isValidMove(boardSnap, file, rank) {
			if(this.File === file && this.Rank === rank) {
				return false;
			}

			const {Direction: direction, Pieces: pieces} = getLineInfo(boardSnap, this.File, this.Rank, file, rank);

			if(direction !== "file" && direction !== "rank") {
				return false;
			}

			return this.isStandardValidLineMove(boardSnap, pieces, file, rank);
		}

		canCapture(boardSnap, file, rank) {
			if(!this.isValidMove(boardSnap, file, rank)) {
				return false;
			}
			const checkCell = `${file}${rank}`;
			return boardSnap[checkCell] && boardSnap[checkCell].Color !== this.Color;
		}
	}
	//#endregion

	//#region Knight
	ns.Knight = class Knight extends ns.Piece {
		static MoveCombos = [
			{RankD: 1, FileD: 2},
			{RankD: 1, FileD: -2},
			{RankD: 2, FileD: 1},
			{RankD: 2, FileD: -1},
			{RankD: -1, FileD: 2},
			{RankD: -1, FileD: -2},
			{RankD: -2, FileD: 1},
			{RankD: -2, FileD: -1},
		]

		get Name() {
			return "Knight";
		}
		get Abbr() {
			return "N";
		}
		get IconKey() {
			return "chess-knight";
		}
		get FlipClass() {
			return this.StartFile === "g" ? "invert-x" : "";
		}
		get Value() {
			return 3;
		}

		getMoves(boardSnap) {
			const moves = ns.Knight.MoveCombos.reduce((moves, moveCombo) => {
				const moveCell = `${GW.Chessboard.getFile(this.File, moveCombo.FileD)}${GW.Chessboard.getRank(this.Rank, moveCombo.RankD)}`;
				if(moveCell.length === 2 && (!boardSnap[moveCell] || boardSnap[moveCell].Color !== this.Color)) {
					moves.push({Cell: moveCell, Capture: boardSnap[moveCell] ? moveCell : null});
				}
				return moves;
			}, []);

			return this.filterByTeamCheck(boardSnap, moves);
		}
	}
	//#endregion

	//#region Bishop
	ns.Bishop = class Bishop extends ns.Piece {
		static LineCombos = [
			{fileStep: 1, rankStep: 1},
			{fileStep: 1, rankStep: -1},
			{fileStep: -1, rankStep: 1},
			{fileStep: -1, rankStep: -1},
		];

		get Name() {
			return "Bishop";
		}
		get Abbr() {
			return "B";
		}
		get IconKey() {
			return "chess-bishop";
		}
		get FlipClass() {
			return this.StartFile === "c" ? "invert-x" : "";
		}
		get Value() {
			return 3;
		}

		getMoves(boardSnap) {
			const moves = [];
			ns.Bishop.LineCombos.forEach(lineSpec => {
				moves.push(...this.getStandardLineMoves(boardSnap, lineSpec.fileStep, lineSpec.rankStep));
			});
			return this.filterByTeamCheck(boardSnap, moves);
		}

		isValidMove(boardSnap, file, rank) {
			if(this.File === file && this.Rank === rank) {
				return false;
			}

			const {Direction: direction, Pieces: pieces} = getLineInfo(boardSnap, this.File, this.Rank, file, rank);

			if(direction !== "file-rank") {
				return false;
			}

			return this.isStandardValidLineMove(boardSnap, pieces, file, rank);
		}

		canCapture(boardSnap, file, rank) {
			if(!this.isValidMove(boardSnap, file, rank)) {
				return false;
			}
			const checkCell = `${file}${rank}`;
			return boardSnap[checkCell] && boardSnap[checkCell].Color !== this.Color;
		}
	}
	//#endregion

	//#region Queen
	ns.Queen = class Queen extends ns.Piece {
		static LineCombos = [
			{fileStep: 1, rankStep: 1},
			{fileStep: 1, rankStep: 0},
			{fileStep: 1, rankStep: -1},
			{fileStep: 0, rankStep: 1},
			{fileStep: 0, rankStep: -1},
			{fileStep: -1, rankStep: 1},
			{fileStep: -1, rankStep: 0},
			{fileStep: -1, rankStep: -1}
		];

		get Name() {
			return "Queen";
		}
		get Abbr() {
			return "Q";
		}
		get IconKey() {
			return "chess-queen";
		}
		get Value() {
			return 9;
		}

		getMoves(boardSnap) {
			const moves = [];
			ns.Queen.LineCombos.forEach(lineSpec => {
				moves.push(...this.getStandardLineMoves(boardSnap, lineSpec.fileStep, lineSpec.rankStep));
			});
			return this.filterByTeamCheck(boardSnap, moves);
		}

		isValidMove(boardSnap, file, rank) {
			if(this.File === file && this.Rank === rank) {
				return false;
			}

			const {Direction: direction, Pieces: pieces} = getLineInfo(boardSnap, this.File, this.Rank, file, rank);

			if(direction !== "file-rank" && direction !== "file" && direction !== "rank") {
				return false;
			}

			return this.isStandardValidLineMove(boardSnap, pieces, file, rank);
		}

		canCapture(boardSnap, file, rank) {
			if(!this.isValidMove(boardSnap, file, rank)) {
				return false;
			}
			const checkCell = `${file}${rank}`;
			return boardSnap[checkCell] && boardSnap[checkCell].Color !== this.Color;
		}
	}
	//#endregion

	//#region King
	ns.King = class King extends ns.Piece {
		static MoveCombos = [
			{RankD: 1, FileD: 1},
			{RankD: 1, FileD: 0},
			{RankD: 1, FileD: -1},
			{RankD: 0, FileD: 1},
			{RankD: 0, FileD: -1},
			{RankD: -1, FileD: 1},
			{RankD: -1, FileD: 0},
			{RankD: -1, FileD: -1},
		]

		get Name() {
			return "King";
		}
		get Abbr() {
			return "K";
		}
		get IconKey() {
			return "chess-king";
		}
		get Value() {
			return 0;
		}

		getMoves(boardSnap) {
			let moves = [];
			for(let moveCombo of ns.King.MoveCombos) {
				const cell = `${GW.Chessboard.getFile(this.File, moveCombo.FileD)}${GW.Chessboard.getRank(this.Rank, moveCombo.RankD)}`;
				if(cell.length !== 2) {continue;}
				if(!boardSnap[cell] || (boardSnap[cell] && boardSnap[cell].Color !== this.Color)) {
					moves.push({Cell: cell, Capture: boardSnap[cell] ? cell : null});
				}
			}
			moves = this.filterByTeamCheck(boardSnap, moves);
			if(this.MoveCount || (!this.DisableCheckCheck && ns.isTeamInCheck(boardSnap, this.Color))) {
				return moves;
			}

			const cellKingSide = `${ORDERED_FILES[ORDERED_FILES.length - 1]}${this.Rank}`;
			const pieceKingSide = boardSnap[cellKingSide];
			if(pieceKingSide
				&& pieceKingSide.Color === this.Color
				&& pieceKingSide.Name === "Rook"
				&& !pieceKingSide.MoveCount
			) {
				const castleStep1 = `${GW.Chessboard.getFile(this.File, 1)}${this.Rank}`;
				const castleStep2 = `${GW.Chessboard.getFile(this.File, 2)}${this.Rank}`;
				if(!this.moveCausesTeamCheck(boardSnap, {Cell: castleStep1, Capture: null})
					&& !this.moveCausesTeamCheck(boardSnap, {Cell: castleStep2, Capture: null})
					&& !boardSnap[castleStep1]
					&& !boardSnap[castleStep2]
				) {
						moves.push({Cell: castleStep2, Capture: null, CastleKS: cellKingSide});
				}
			}

			const cellQueenSide = `${ORDERED_FILES[0]}${this.Rank}`;
			const pieceQueenSide = boardSnap[cellQueenSide];
			if(pieceQueenSide
				&& pieceQueenSide.Color === this.Color
				&& pieceQueenSide.Name === "Rook"
				&& !pieceQueenSide.MoveCount
			) {
				const castleStep1 = `${GW.Chessboard.getFile(this.File, -1)}${this.Rank}`;
				const castleStep2 = `${GW.Chessboard.getFile(this.File, -2)}${this.Rank}`;
				const castleStep3 = `${GW.Chessboard.getFile(this.File, -3)}${this.Rank}`;
				if(!this.moveCausesTeamCheck(boardSnap, {Cell: castleStep1, Capture: null})
					&& !this.moveCausesTeamCheck(boardSnap, {Cell: castleStep2, Capture: null})
					&& !boardSnap[castleStep1]
					&& !boardSnap[castleStep2]
					&& !boardSnap[castleStep3]
				) {
						moves.push({Cell: castleStep2, Capture: null, CastleQS: cellQueenSide});
				}
			}

			return moves;
		}
	}
	//#endregion

	//#region Helpers
	function getLineInfo(boardSnap, fileOne, rankOne, fileTwo, rankTwo) {
		const fileOneIdx = FILE_ORDER_INDEX[fileOne];
		const fileTwoIdx = FILE_ORDER_INDEX[fileTwo];
		const startFileIdx = Math.min(fileOneIdx, fileTwoIdx);
		const endFileIdx = Math.max(fileOneIdx, fileTwoIdx);
		const fileDelta = endFileIdx - startFileIdx;

		const rankOneIdx = RANK_ORDER_INDEX[rankOne];
		const rankTwoIdx = RANK_ORDER_INDEX[rankTwo];
		const startRankIdx = Math.min(rankOneIdx, rankTwoIdx);
		const endRankIdx = Math.max(rankOneIdx, rankTwoIdx);
		const rankDelta = endRankIdx - startRankIdx;

		const info = {Direction: "", Pieces: {}};

		if(fileDelta === rankDelta) {
			info.Direction = "file-rank";
			const fileDir = ((fileTwoIdx - fileOneIdx) < 0) ? -1 : 1;
			const rankDir = ((rankTwoIdx - rankOneIdx) < 0) ? -1 : 1;
			for(let delta = 0; delta <= fileDelta; delta++) {
				const cell = `${ORDERED_FILES[fileOneIdx + (delta*fileDir)]}${ORDERED_RANKS[rankOneIdx + (delta*rankDir)]}`
				if(boardSnap[cell]) {
					info.Pieces[cell] = true;
				}
			}
		}
		else if(fileDelta === 0) {
			info.Direction = "file";
			for(let rankIdx = startRankIdx; rankIdx <= endRankIdx; rankIdx++) {
				const cell = `${fileOne}${ORDERED_RANKS[rankIdx]}`
				if(boardSnap[cell]) {
					info.Pieces[cell] = true;
				}
			}
		}
		else if(rankDelta === 0) {
			info.Direction = "rank";
			for(let fileIdx = startFileIdx; fileIdx <= endFileIdx; fileIdx++) {
				const cell = `${ORDERED_FILES[fileIdx]}${rankOne}`
				if(boardSnap[cell]) {
					info.Pieces[cell] = true;
				}
			}
		}

		return info;
	}

	function getLineUntilBlocked(boardSnap, startFile, startRank, fileStep, rankStep) {
		let blocked = false;
		if(fileStep === 0 && rankStep === 0) {
			debugger; //Hey are you sure
			blocked = true;
		}

		const cells = [];
		let fileIdx = FILE_ORDER_INDEX[startFile];
		let rankIdx = RANK_ORDER_INDEX[startRank];
		
		fileIdx += fileStep;
		rankIdx += rankStep;
		while(fileIdx >= 0
			&& rankIdx >= 0
			&& fileIdx < ORDERED_FILES.length
			&& rankIdx < ORDERED_RANKS.length
			&& !blocked
		) {
			const cell = `${ORDERED_FILES[fileIdx]}${ORDERED_RANKS[rankIdx]}`;
			cells.push(cell);
			if(boardSnap[cell]) {
				blocked = true;
			}
			fileIdx += fileStep;
			rankIdx += rankStep;
		}

		return {Cells: cells, Blocked: blocked};
	}
	//#endregion Helpers
}) (window.GW.Chessboard.Pieces = window.GW.Chessboard.Pieces || {});