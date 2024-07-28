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
	 *			"RC to RC", ...
	 *		]
	 *	}
	 */
	ns.SavesList = [];
	ns.Data = {
		Name: "",
		Timestamp: null,
		Moves: [],
	};

	//#region Load & Save
	ns.onLoad = async (event) => {
		event.preventDefault();

		switch(event.target.elements["loadMode"].value) {
			case "local":
				ns.Data = JSON.parse(localStorage.getItem(
					`game-${document.getElementById("selLoadLocal").value}`
				));
				updateFileInfo();
				renderGameData();
				break;
			case "upload":
				const loadedData = await GW.Gizmos.FileLib.promptFileAsJSON();
				if(loadedData && loadedData.Timestamp && loadedData.Moves){
					ns.Data = loadedData;
					ns.Data.Name = GW.Gizmos.FileLib.LastLoadedFilename;
					updateFileInfo();
					renderGameData();
				}
				break;
		}
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
		event.preventDefault();
		
		ns.Data = {
			Name: "",
			Timestamp: null,
			Moves: [],
		};
		renderGameData();
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
		timSave.setAttribute("datetime", ns.Data.Timestamp)
		timSave.innerText = new Date(ns.Data.Timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });

		document.getElementById("spnName").innerText = ns.Data.Name ? `File: ${ns.Data.Name}` : "";
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

	//#region Rendering
	function renderGameData() {
		ns.renderBoardAtMove(ns.Data.Moves.length - 1);
	}

	ns.renderBoardAtMove = (moveIdx) => {

	}
	//#endregion
}) (window.GW.Chessboard = window.GW.Chessboard || {});

window.addEventListener("load", () => {
	GW.Chessboard.reloadSavesList();
});
window.addEventListener("beforeunload", (event) => {});