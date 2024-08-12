/**
 * @file Code chess pieces
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Pieces(ns) {
	const ORDERED_FILES = GW.Chessboard.ORDERED_FILES;
	const ORDERED_RANKS = GW.Chessboard.ORDERED_RANKS;
	const RANK_ORDER_INDEX = GW.Chessboard.RANK_ORDER_INDEX;
	const FILE_ORDER_INDEX = GW.Chessboard.FILE_ORDER_INDEX;

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

	//#region Piece
	ns.Piece = class Piece {
		Color;
		StartFile;

		File;
		Rank;
		MoveCount;

		DisableCheckCheck;
		constructor(color, startFile, startRank) {
			this.Color = color;
			this.StartFile = startFile;

			this.File = startFile;
			this.Rank = startRank;

			this.MoveCount = 0;

			this.DisableCheckCheck = false;
		}

		get Name() {
			throw new Error("Name is not implemented");
		}
		get Abbr() {
			throw new Error("Abbr is not implemented");
		}
		get IconKey() {
			throw new Error("IconKey is not implemented");
		}
		get FlipClass() {
			return "";
		}
		get Icon() {
			return `<gw-icon
				iconKey="${this.IconKey}"
				title="${this.Color} ${this.Name}"
				iconClasses="${this.Color} ${this.FlipClass}"
				class="piece"
			></gw-icon>`
		}

		clone() {
			const clone = new ns[this.Name](this.Color, this.StartFile);
			clone.MoveCount = this.MoveCount;
			return clone;
		}

		moveTo(file, rank) {
			this.Rank = rank;
			this.File = file;
			this.MoveCount++;
		}

		getMoves(boardSnap) {
			throw new Error("getMoves is not implemented");
		}

		isValidMove(boardSnap, file, rank) {
			return false;
			//throw new Error("isValidMove is not implemented");
		}

		canCapture(boardSnap, file, rank) {
			return false;
			//throw new Error("canCapture is not implemented");
		}

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

		filterByTeamCheck(boardSnap, moves) {
			if(this.DisableCheckCheck) {
				return moves;
			}
			return moves.filter(move => !this.moveCausesTeamCheck(boardSnap, move));
		}

		moveCausesTeamCheck(boardSnap, move) {
			if(this.DisableCheckCheck) {
				return false;
			}
			//TODO
			return false;
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

		moveTo(file, rank) {
			if(Math.abs(rank - this.Rank) === 2) {
				this.EnPassantable = true;
			}
			super.moveTo(file, rank);
		}

		getMoves(boardSnap) {
			const moves = [];

			const dir = this.Color === "white" ? -1 : 1;

			const cellOneUp = `${this.File}${GW.Chessboard.getRank(this.Rank, dir)}`;
			if(!boardSnap[cellOneUp]) {
				moves.push({Cell: cellOneUp, Capture: null});
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

			return this.filterByTeamCheck(boardSnap, moves);
		}

		isValidMove(boardSnap, file, rank) {
			const move = this.getMoves(boardSnap).filter(
				move => move.Cell[0] === file && move.Cell[1] === rank
			)[0];

			return !!move;
		}

		canCapture(boardSnap, rank, file) {
			const move = this.getMoves(boardSnap).filter(
				move => move.Capture && move.Capture[0] === file && move.Capture[1] === rank
			)[0];

			return !!move;
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

		isValidMove(boardSnap, file, rank) {
			const move =  this.getMoves(boardSnap).filter(
				move => move.Cell[0] === file && move.Cell[1] === rank
			)[0];
			
			return !!move;
		}

		canCapture(boardSnap, rank, file) {
			const move = this.getMoves(boardSnap).filter(
				move => move.Capture && move.Capture[0] === file && move.Capture[1] === rank
			)[0];

			return !!move;
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
		get Name() {
			return "King";
		}
		get Abbr() {
			return "K";
		}
		get IconKey() {
			return "chess-king";
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