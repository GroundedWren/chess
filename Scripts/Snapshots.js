/**
 * @file Code for game state snapshots
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Snapshots(ns) {
	ns.buildGameSnapshots = function buildGameSnapshots() {
		ns.List = [];

		const initSnap = {};
		GW.Chessboard.ORDERED_FILES.forEach(file => {
			initSnap[`${file}7`] = new GW.Chessboard.Pieces.Pawn("black", file, "7");
			initSnap[`${file}2`] = new GW.Chessboard.Pieces.Pawn("white", file, "2");
			switch(file) {
				case "a":
				case "h":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Rook("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Rook("white", file, "1");
					break;
				case "b":
				case "g":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Knight("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Knight("white", file, "1");
					break;
				case "c":
				case "f":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Bishop("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Bishop("white", file, "1");
					break;
				case "d":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.Queen("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.Queen("white", file, "1");
					break;
				case "e":
					initSnap[`${file}8`] = new GW.Chessboard.Pieces.King("black", file, "8");
					initSnap[`${file}1`] = new GW.Chessboard.Pieces.King("white", file, "1");
					break;
			}
		});
		initSnap["b4"] = new GW.Chessboard.Pieces.Bishop("white", "b", "4");
		ns.List.push(initSnap);

		for(let i = 0; i < GW.Chessboard.Data.Moves.length; i++) {
			ns.List.push(getSnapshot(
				ns.List[i],
				GW.Chessboard.Data.Moves[i],
				i % 2 == 0 ? "white" : "black"
			));
		}
	}

	function getSnapshot(snapshot, move, color) {
		const newSnap = {};
		Object.keys(snapshot).forEach(cell => newSnap[cell] = snapshot[cell].clone());
		//TODO
	}

	ns.applyMove = function applyMove(snapshot, cellStart, move) {
		const piece = snapshot[cellStart];
		if(!piece) {
			debugger; //Hey maybe see how this happened
			return;
		}

		if(move.Capture) {
			delete snapshot[move.Capture];
		}
		piece.moveTo(move.Cell[0], move.Cell[1]);
		snapshot[move.Cell] = piece;
		delete snapshot[cellStart];

		//Recursion, but should be rare and only ever go one deep
		if(move.CastleKS) {
			ns.applyMove(snapshot, move.CastleKS, {Cell: `${GW.Chessboard.getFile(piece.File, -1)}${piece.Rank}`, Capture: null});
		}
		else if (move.CastleQS) {
			ns.applyMove(snapshot, move.CastleQS, {Cell: `${GW.Chessboard.getFile(piece.File, 1)}${piece.Rank}`, Capture: null});
		}
	}
}) (window.GW.Chessboard.Snapshots = window.GW.Chessboard.Snapshots || {});