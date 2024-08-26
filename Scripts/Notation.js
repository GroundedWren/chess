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
			move.Promotion ? `=${new GW.Chessboard.Pieces[move.Promotion]().Abbr}` : ""
		}${
			causesCheck ? "+" : ""
		}${
			causesCheckmate ? "#" : ""
		}`;
	}

	//TODO
	ns.getNotationAsMove = function getNotationAsMove(note, color, boardSnap) {
		return {CellStart: "", Move: {Cell: "e4", Capture: null, Promotion: null, CastleKS: null, CastleQS: null}};
	}
}) (window.GW.Chessboard.Notation = window.GW.Chessboard.Notation || {});