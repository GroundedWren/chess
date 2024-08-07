/**
 * @file Chessboard scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW = window.GW || {};
(function Chessboard(ns) {
	/**
	 *	Data: {
	 *		Name: "filename"
	 *		Timestamp: Date,
	 *		Moves: [
	 *			"Move in algebraic notation", ...
	 *		]
	 *	}
	 */
	ns.SavesList = [];
	ns.Data = {
		Name: "",
		Timestamp: null,
		Moves: [],
	};
	ns.ORDERED_RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
	ns.ORDERED_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
	ns.Snapshots = [];

	//#region Load & Save
	ns.onLoad = async (event) => {
		event.preventDefault();

		switch(event.target.elements["loadMode"].value) {
			case "local":
				ns.Data = JSON.parse(localStorage.getItem(
					`game-${document.getElementById("selLoadLocal").value}`
				));
				break;
			case "upload":
				const loadedData = await GW.Gizmos.FileLib.promptFileAsJSON();
				if(!loadedData || !loadedData.Timestamp || !loadedData.Moves){
					return;
				}
				ns.Data = loadedData;
				ns.Data.Name = GW.Gizmos.FileLib.LastLoadedFilename;
				break;
		}

		updateFileInfo();
		buildGameSnapshots();
		ns.setSnapshot(0);
	};
	ns.onSave = (event) => {
		event.preventDefault();

		switch(event.target.elements["saveMode"].value) {
			case "new":
				const txtSaveName = document.getElementById("txtSaveName");
				saveToLocal(txtSaveName.value);
				txtSaveName.value = "";
				event.target.elements["saveMode"].value = "existing";
				ns.onSaveModeChange(undefined, event.target);
				break;
			case "existing":
				saveToLocal(document.getElementById("selSaveExisting").value);
				break;
			case "download":
				saveToFile();
				break;
		}
	};

	ns.newGame = (event) => {
		event?.preventDefault();
		
		ns.Data = {
			Name: "",
			Timestamp: null,
			Moves: [],
		};
		updateFileInfo();
		buildGameSnapshots();
		ns.setSnapshot(0);
	};

	function saveToLocal(gameName) {
		beforeSave(gameName);
		if(!ns.SavesList.includes(gameName)) {
			ns.SavesList.unshift(gameName);
			localStorage.setItem("saves-list", JSON.stringify(ns.SavesList));
			ns.reloadSavesList();
		}
		localStorage.setItem(`game-${gameName}`, JSON.stringify(ns.Data));
		updateFileInfo();
	}

	async function saveToFile() {
		const suggestedName = ns.Data.Name || "New Game";
		beforeSave();
		ns.Data.Name = await GW.Gizmos.FileLib.saveToFile(JSON.stringify(ns.Data), "application/json", "json", suggestedName);
		updateFileInfo();
	}

	function beforeSave(gameName) {
		if(gameName) {
			ns.Data.Name = gameName;
		}
		else {
			delete ns.Data.Name;
		}
		ns.Data.Timestamp = new Date().toISOString();
	}
	function updateFileInfo() {
		const timSave = document.getElementById("timSave");
		timSave.setAttribute("datetime", ns.Data.Timestamp || "")
		timSave.innerText = ns.Data.Timestamp
			? new Date(ns.Data.Timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })
			: "-";

		document.getElementById("spnName").innerHTML = ns.Data.Name ? `File: ${ns.Data.Name}` : "";
	}

	ns.reloadSavesList = function processLocalSaves() {
		const savesSerialized = localStorage.getItem("saves-list");
		GW.Chessboard.SavesList = savesSerialized ? JSON.parse(savesSerialized) : [];

		if(ns.SavesList.length) {
			const loadOptions = ns.SavesList.map(saveKey => 
				`<option value="${saveKey}">${saveKey}</option>`
			).join("");

			document.getElementById("selLoadLocal").innerHTML = loadOptions;
			document.getElementById("selSaveExisting").innerHTML = loadOptions;
		}
		else {
			document.getElementById("selLoadLocal").innerHTML = `<option value="">No saves</option>`;
			document.getElementById("selSaveExisting").innerHTML = `<option value="">No saves</option>`;
		}
	};

	ns.onLoadModeChange = (event) => {
		const selLoadLocal = document.getElementById("selLoadLocal");

		if(event.target.getAttribute("aria-controls") === "divLoadLocal") {
			selLoadLocal.setAttribute("required", "true");
		}
		else {
			selLoadLocal.removeAttribute("required");
		}
	};
	ns.onSaveModeChange = (event, formEl) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const selSaveExisting = document.getElementById("selSaveExisting");

		switch((event ? event.target : formEl).getAttribute("aria-controls")) {
			case "divNewSave":
				txtSaveName.setAttribute("required", "true");
				selSaveExisting.removeAttribute("required");
				break;
			case "divExistingSave":
				selSaveExisting.setAttribute("required", "true");
				txtSaveName.removeAttribute("required");
				break;
			default:
				txtSaveName.removeAttribute("required");
				selSaveExisting.removeAttribute("required");
				break;
		}
	};

	ns.onTxtSaveNameInput = (_event) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const nameVal = txtSaveName.value;
		if(nameVal && ns.SavesList.includes(nameVal)) {
			txtSaveName.setCustomValidity("Save exists");
		}
		else {
			txtSaveName.setCustomValidity("");
		}
	};
	//#endregion

	//#region Snapshots
	function buildGameSnapshots() {
		ns.Snapshots = [];

		const initSnap = {};
		ns.ORDERED_FILES.forEach(file => {
			initSnap[`${file}7`] = new ns.Pieces.Pawn("black");
			initSnap[`${file}2`] = new ns.Pieces.Pawn("white");
			switch(file) {
				case "a":
				case "h":
					initSnap[`${file}8`] = new ns.Pieces.Rook("black", file);
					initSnap[`${file}1`] = new ns.Pieces.Rook("white", file);
					break;
				case "b":
				case "g":
					initSnap[`${file}8`] = new ns.Pieces.Knight("black", file);
					initSnap[`${file}1`] = new ns.Pieces.Knight("white", file);
					break;
				case "c":
				case "f":
					initSnap[`${file}8`] = new ns.Pieces.Bishop("black", file);
					initSnap[`${file}1`] = new ns.Pieces.Bishop("white", file);
					break;
				case "d":
					initSnap[`${file}8`] = new ns.Pieces.Queen("black", file);
					initSnap[`${file}1`] = new ns.Pieces.Queen("white", file);
					break;
				case "e":
					initSnap[`${file}8`] = new ns.Pieces.King("black", file);
					initSnap[`${file}1`] = new ns.Pieces.King("white", file);
					break;
			}
		});
		ns.Snapshots.push(initSnap);

		for(let i = 0; i < ns.Data.Moves.length; i++) {
			ns.Snapshots.push(getSnapshot(
				ns.Snapshots[i],
				ns.Data.Moves[i],
				i % 2 == 0 ? "white" : "black"
			));
		}
	}

	function getSnapshot(snapshot, move, color) {
		const newSnap = {};
		Object.keys(snapshot).forEach(cell => newSnap[cell] = snapshot[cell].clone());
	}
	//#endregion

	//#region Rendering
	ns.setSnapshot = (snapshotIdx) => {
		const snapshot = ns.Snapshots[snapshotIdx];
		renderBoardAtSnapshot(snapshot);
	}

	function renderBoardAtSnapshot (snapshot) {
		
		document.getElementById("tbodyBoard").innerHTML = ns.ORDERED_RANKS.map(rank => `
		<tr>
			<th scope="row">${rank}</th>
			${ns.ORDERED_FILES.map(file => `
			<td><div>
				${snapshot[`${file}${rank}`] ? snapshot[`${file}${rank}`].Icon : ""}
			</div></td>
			`).join("")}
		</tr>
		`).join("");
	}
	//#endregion

	//#region Pieces
	ns.Pieces = {};
	ns.Pieces.Piece = class Piece {
		Color;
		StartFile;
		constructor(color, startFile) {
			this.Color = color;
			this.StartFile = startFile;
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
			></gw-icon>`
		}

		clone() {
			return new ns.Pieces[this.Name](this.Color, this.StartFile);
		}
	}

	ns.Pieces.Pawn = class Pawn extends ns.Pieces.Piece {
		get Name() {
			return "Pawn";
		}
		get Abbr() {
			return "";
		}
		get IconKey() {
			return "chess-pawn";
		}
	}

	ns.Pieces.Rook = class Rook extends ns.Pieces.Piece {
		get Name() {
			return "Rook";
		}
		get Abbr() {
			return "R";
		}
		get IconKey() {
			return "chess-rook";
		}
	}

	ns.Pieces.Knight = class Knight extends ns.Pieces.Piece {
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
	}

	ns.Pieces.Bishop = class Bishop extends ns.Pieces.Piece {
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
	}

	ns.Pieces.Queen = class Queen extends ns.Pieces.Piece {
		get Name() {
			return "Queen";
		}
		get Abbr() {
			return "Q";
		}
		get IconKey() {
			return "chess-queen";
		}
	}

	ns.Pieces.King = class King extends ns.Pieces.Piece {
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

	//#region Notation

	//#endregion
}) (window.GW.Chessboard = window.GW.Chessboard || {});

window.addEventListener("load", () => {
	const cbxDarkMode = document.getElementById("cbxDarkMode");
	const theme = localStorage.getItem("theme");
	switch(theme) {
		case "light":
			cbxDarkMode.checked = false;
			break;
		case "dark":
			cbxDarkMode.checked = true;
			break;
		default:
			cbxDarkMode.checked = window.matchMedia("(prefers-color-scheme: dark)").matches;
			break;
	}

	GW.Chessboard.reloadSavesList();
	GW.Chessboard.newGame();
});
window.addEventListener("beforeunload", (event) => {});