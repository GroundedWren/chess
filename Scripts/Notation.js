/**
 * @file Code for interpereting algebraic notation
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Notation(ns) {
	ns.getMoveAsNotation = function getMoveAsNotation(cellStart, move, beforeSnap, afterSnap) {
		if(move.CastleKS) {
			return "0-0";
		}
		if(move.CastleQS) {
			return "0-0-0";
		}

		const movingPiece = beforeSnap[cellStart];

		const capturePieceComponent = movingPiece.Name === "Pawn" ? cellStart[0] : "";

		let causesCheck = GW.Chessboard.Pieces.isTeamInCheck(afterSnap, movingPiece.Color === "white" ? "black" : "white");
		const causesCheckmate = GW.Chessboard.Pieces.isTeamInCheckmate(
			afterSnap,
			movingPiece.Color === "white" ? "black" : "white"
		);
		if(causesCheckmate) {
			causesCheck = false;
		}

		let pieceDisambiguator = "";
		const ambiguousPieces = Object.values(beforeSnap).filter(
			piece => piece.Color === movingPiece.Color
				&& piece.Abbr === movingPiece.Abbr
				&& (piece.StartFile !== movingPiece.StartFile || piece.StartRank !== movingPiece.StartRank)
				&& piece.isValidMove(beforeSnap, move.Cell[0], move.Cell[1])
		);
		if(ambiguousPieces.length) {
			if(ambiguousPieces.filter(piece => piece.File === movingPiece.File).length === 0) {
				pieceDisambiguator = movingPiece.File;
			}
			else if (ambiguousPieces.filter(piece => piece.Rank === movingPiece.Rank).length === 0) {
				pieceDisambiguator = movingPiece.Rank;
			}
			else {
				pieceDisambiguator = cellStart;
			}
		}

		return `${
			movingPiece.Abbr
		}${
			pieceDisambiguator
		}${
			move.Capture ? `${capturePieceComponent}x` : ""
		}${
			move.Cell
		}${
			move.Promotion ? `=${GW.Chessboard.Pieces.getPieceAbbrFromName(move.Promotion)}` : ""
		}${
			causesCheck ? "+" : ""
		}${
			causesCheckmate ? "#" : ""
		}`;
	}

	ns.getNotationAsMove = function getNotationAsMove(note, color, boardSnap) {
		let disNote = note.replaceAll("+", "");
		disNote = disNote.replaceAll("#", "");

		if(disNote === "0-0") {
			return {
				CellStart: color === "white" ? "e8" : "e1",
				Move: {Cell: color === "white" ? "g1" : "g8", CastleKS: color === "white" ? "f1" : "f8"}
			};
		}
		if(disNote === "0-0-0") {
			return {
				CellStart: color === "white" ? "e8" : "e1",
				Move: {Cell: color === "white" ? "c1" : "c8", CastleKS: color === "white" ? "d1" : "d8"}
			};
		}

		let promotion;
		[disNote, promotion] = disNote.split("=");

		const doesCapture = disNote.includes("x");
		disNote = disNote.replaceAll("x", "");

		let pieceName = GW.Chessboard.Pieces.getPieceNameFromAbbr(disNote[0]);
		if(pieceName) {
			disNote = disNote.substring(1);
		}
		else {
			pieceName = "Pawn";
		}

		const toCell = disNote.substring(disNote.length - 2);
		disNote = disNote.substring(0, disNote.length - 2);

		let disambigFile = "";
		let disambigRank = "";
		if(disNote.length) {
			disambigFile = disNote[0];
		}
		if(disNote.length === 2) {
			disambigRank = disNote[1];
		}

		const movingPiece = Object.values(boardSnap).find(
			piece => piece.Color === color
				&& (!disambigFile || piece.File === disambigFile)
				&& (!disambigRank || piece.Rank === disambigRank)
				&& piece.Name === pieceName
				&& piece.isValidMove(boardSnap, toCell[0], toCell[1])
		);

		if(!movingPiece) {
			alert(`Invalid move: ${note}`);
			return {};
		}

		let capture = null;
		if(doesCapture) {
			capture = movingPiece.getMoves(boardSnap).find(move => move.Cell === toCell).Capture;
		}

		return {
			CellStart: `${movingPiece.File}${movingPiece.Rank}`,
			Move: {Cell: toCell, Capture: capture, Promotion: GW.Chessboard.Pieces.getPieceNameFromAbbr(promotion)}
		};
	}
}) (window.GW.Chessboard.Notation = window.GW.Chessboard.Notation || {});