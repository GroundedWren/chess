/**
 * @file Code for interpereting algebraic notation
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Notation(ns) {
	//TODO
	ns.getMoveAsNotation = function getMoveAsNotation(cellStart, move, boardSnap) {
		return "placeholder";
	}

	//TODO
	ns.getNotationAsMove = function getNotationAsMove(note, color, boardSnap) {
		return {CellStart: "", Move: {Cell: "e4", Capture: null, Promotion: null, CastleKS: null, CastleQS: null}};
	}
}) (window.GW.Chessboard.Notation = window.GW.Chessboard.Notation || {});