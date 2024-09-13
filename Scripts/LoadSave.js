/**
 * @file Code for loading and saving games
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function LoadSave(ns) {
	/**
	 * Loads the initial game
	 */
	ns.configureInitialGame = () => {
		reloadSavesList();

		const params = new URLSearchParams(window.location.search);
		if(params.has("moves")) {
			GW.Chessboard.Data.Moves = decodeURIComponent(params.get("moves")).split("^");
			GW.Chessboard.Snapshots.buildGameSnapshots();
			GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
			return;
		}

		const lastSaveName = localStorage.getItem("last-save-name");
		const lastSaveDataStr = localStorage.getItem(`game-${lastSaveName}`);
		if(lastSaveName === "!temp") {
			GW.Chessboard.Data = JSON.parse(lastSaveDataStr);
			GW.Chessboard.Snapshots.buildGameSnapshots();
			GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
		}
		else if(lastSaveDataStr) {
			GW.Chessboard.Data = JSON.parse(lastSaveDataStr);
			updateForLocalSave(GW.Chessboard.Data.Name);

			GW.Chessboard.Snapshots.buildGameSnapshots();
			GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
		}
		else {
			ns.newGame();
		}
	};
	
	/**
	 * Handler for form submits to load a game
	 * @param {SubmitEvent} event 
	 */
	ns.onLoad = async (event) => {
		event.preventDefault();

		switch(event.target.elements["loadMode"].value) {
			case "local":
				const gameName = document.getElementById("selLoadLocal").value;
				GW.Chessboard.Data = JSON.parse(localStorage.getItem(
					`game-${gameName}`
				));

				updateForLocalSave(gameName);
				break;
			case "upload":
				const loadedData = await GW.Gizmos.FileLib.promptFileAsJSON();
				if(!loadedData || !loadedData.Timestamp || !loadedData.Moves){
					return;
				}
				GW.Chessboard.Data = loadedData;
				GW.Chessboard.Data.Name = GW.Gizmos.FileLib.LastLoadedFilename;

				ns.saveToLocal(GW.Gizmos.FileLib.LastLoadedFilename, GW.Chessboard.Data.Timestamp);
				break;
		}

		GW.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
	};

	/**
	 * Handler for form submits to save a game
	 * @param {SubmitEvent} event 
	 */
	ns.onSave = (event) => {
		event.preventDefault();

		switch(event.target.elements["saveMode"].value) {
			case "new":
				const txtSaveName = document.getElementById("txtSaveName");
				const saveName = txtSaveName.value;
				txtSaveName.value = "";

				ns.saveToLocal(saveName);
				break;
			case "existing":
				ns.saveToLocal(document.getElementById("selSaveExisting").value);
				break;
			case "download":
				saveToFile();
				break;
		}
	};
	
	/**
	 * Handler for form submits to begin a new game
	 * @param {SubmitEvent} event 
	 */
	ns.newGame = (event) => {
		event?.preventDefault();

		localStorage.removeItem("last-save-name");
		
		GW.Chessboard.Data = {
			Name: "",
			Timestamp: null,
			Moves: [],
		};
		updateFileInfo();
		GW.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(0);
	};

	/**
	 * Saves the game data to local storage
	 * @param {string} gameName Name to associate with the save
	 * @param {string} timestamp Timestamp to associate with the save
	 */
	ns.saveToLocal = function saveToLocal(gameName, timestamp) {
		beforeSave(gameName, timestamp);
		if(!GW.Chessboard.SavesList.includes(gameName)) {
			GW.Chessboard.SavesList.unshift(gameName);
			localStorage.setItem("saves-list", JSON.stringify(GW.Chessboard.SavesList));
			reloadSavesList();
		}
		localStorage.setItem(`game-${gameName}`, JSON.stringify(GW.Chessboard.Data));
		updateForLocalSave(gameName);
	}

	function updateForLocalSave(gameName) {
		localStorage.setItem("last-save-name", gameName);
		document.getElementById("formSave").elements["saveMode"].value = "existing";
		document.getElementById("selSaveExisting").value = gameName;
		updateSaveForm(document.getElementById("radSaveModeExisting"));
		updateFileInfo();
	}

	/**
	 * Creates a temp save
	 */
	ns.tempSave = function tempSave() {
		localStorage.setItem("last-save-name", "!temp");
		localStorage.setItem(`game-!temp`, JSON.stringify(GW.Chessboard.Data))
	}

	/**
	 * Copies a URL of the game state to the clipboard
	 */
	ns.saveToURL = function saveToURL() {
		GW.Chessboard.writeToClipboard(
			`https://chess.groundedwren.com?moves=${encodeURIComponent(GW.Chessboard.Data.Moves.join("^"))}`
		);
	}

	async function saveToFile() {
		const suggestedName = GW.Chessboard.Data.Name || "New Game";
		beforeSave();
		GW.Chessboard.Data.Name = await GW.Gizmos.FileLib.saveToFile(
			JSON.stringify(GW.Chessboard.Data),
			"application/json",
			"json",
			suggestedName
		);
		updateFileInfo();
	}

	function beforeSave(gameName, timestamp) {
		if(gameName) {
			GW.Chessboard.Data.Name = gameName;
		}
		else {
			delete GW.Chessboard.Data.Name;
		}
		GW.Chessboard.Data.Timestamp = timestamp || new Date().toISOString();
	}
	function updateFileInfo() {
		const timSave = document.getElementById("timSave");
		timSave.setAttribute("datetime", GW.Chessboard.Data.Timestamp || "")
		timSave.innerText = GW.Chessboard.Data.Timestamp
			? new Date(GW.Chessboard.Data.Timestamp).toLocaleString(
				undefined,
				{ dateStyle: "short", timeStyle: "medium" }
			)
			: "-";

		document.getElementById("spnName").innerHTML = GW.Chessboard.Data.Name
			? `File: ${GW.Chessboard.Data.Name}`
			: "";
	}

	function reloadSavesList() {
		const savesSerialized = localStorage.getItem("saves-list");
		GW.Chessboard.SavesList = savesSerialized ? JSON.parse(savesSerialized) : [];

		if(GW.Chessboard.SavesList.length) {
			const loadOptions = GW.Chessboard.SavesList.map(saveKey => 
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

	/**
	 * Handler for when the load mode changes
	 * @param {Event} event Change event
	 */
	ns.onLoadModeChange = (event) => {
		const selLoadLocal = document.getElementById("selLoadLocal");

		if(event.target.getAttribute("aria-controls") === "divLoadLocal") {
			selLoadLocal.setAttribute("required", "true");
		}
		else {
			selLoadLocal.removeAttribute("required");
		}
	};

	/**
	 * Handler for when the save mode changes
	 * @param {Event} event Change event
	 */
	ns.onSaveModeChange = (event) => {
		updateSaveForm(event.target);
	};

	function updateSaveForm(radSelected) {
		const txtSaveName = document.getElementById("txtSaveName");
		const selSaveExisting = document.getElementById("selSaveExisting");

		switch(radSelected.getAttribute("aria-controls")) {
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
	}

	/**
	 * Handler for when the save name is changed
	 * @param {InputEvent} _event 
	 */
	ns.onTxtSaveNameInput = (_event) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const nameVal = txtSaveName.value;
		if(nameVal && GW.Chessboard.SavesList.includes(nameVal)) {
			txtSaveName.setCustomValidity("Save exists");
		}
		else {
			txtSaveName.setCustomValidity("");
		}
	};
}) (window.GW.Chessboard.LoadSave = window.GW.Chessboard.LoadSave || {});