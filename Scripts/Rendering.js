/**
 * @file Code for rendering and using the board
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function Rendering(ns) {
	const ORDERED_FILES = GW.Chessboard.ORDERED_FILES;
	const ORDERED_RANKS = GW.Chessboard.ORDERED_RANKS;
	const RANK_ORDER_INDEX = GW.Chessboard.RANK_ORDER_INDEX;
	const FILE_ORDER_INDEX = GW.Chessboard.FILE_ORDER_INDEX;

	ns.CurrentSnapshotIdx = 0;

	/**
	 * @returns The color due to move at the current snapshot
	 */
	ns.getCurrentMovingColor = function getCurrentMovingColor() {
		return ns.CurrentSnapshotIdx % 2 == 0 ? "white" : "black";
	}

	/**
	 * Renders the previous snapshot
	 */
	ns.prevSnapshot = () => {
		ns.setSnapshot(snapshotIdx - 1);
	}

	/**
	 * Renders the next snapshot
	 */
	ns.nextSnapshot = () => {
		ns.setSnapshot(snapshotIdx + 1);
	}

	/**
	 * Renders a specified snapshot
	 * @param {number} snapshotIdx Index of the snapshot to render
	 */
	ns.setSnapshot = (snapshotIdx) => {
		ns.CurrentSnapshotIdx = snapshotIdx;
		const snapshot = GW.Chessboard.Snapshots.List[snapshotIdx];
		renderBoardAtSnapshot(snapshot);

		const btnPrevMove = document.getElementById("btnPrevMove")
		if(ns.CurrentSnapshotIdx === 0) {
			btnPrevMove.setAttribute("disabled", "true");
		}
		else {
			btnPrevMove.removeAttribute("disabled");
			btnPrevMove.onclick = GW.createDelegate(ns, ns.setSnapshot, [ns.CurrentSnapshotIdx - 1]);
		}

		const btnNextMove = document.getElementById("btnNextMove")
		if(ns.CurrentSnapshotIdx === GW.Chessboard.Snapshots.List.length - 1) {
			btnNextMove.setAttribute("disabled", "true");
		}
		else {
			btnNextMove.removeAttribute("disabled");
			btnNextMove.onclick = GW.createDelegate(ns, ns.setSnapshot, [ns.CurrentSnapshotIdx + 1]);
		}

		const spnMoveIdx = document.getElementById("spnMoveIdx");
		const newText = `Move ${ns.CurrentSnapshotIdx} of ${GW.Chessboard.Snapshots.List.length - 1}`
		if(spnMoveIdx.innerText !== newText){
			spnMoveIdx.innerText = newText;
		}

		renderMovesList(snapshotIdx);

		document.getElementById("divToMove").innerText = `${ns.getCurrentMovingColor()} to move`;
	}

	function renderMovesList(snapshotIdx) {
		const olMoves = document.getElementById("olMoves");
		olMoves.innerHTML = null;

		for(let i = GW.Chessboard.Data.Moves.length - 1; i >= -1; i--) {
			let moveMarkup = "Initial board";
			if(i > -1) {
				const move = GW.Chessboard.Data.Moves[i];
				let pieceName = GW.Chessboard.Pieces.getPieceNameFromAbbr(move[0]) || "Pawn";
				if(move[0] === "0") {
					pieceName = "King";
				}
				const piece = new GW.Chessboard.Pieces[pieceName](i % 2 == 0 ? "white" : "black");
				moveMarkup = `${piece.Icon}${move}`;
			}
			if(i === snapshotIdx - 1) {
				document.getElementById("divCurMove").innerHTML = moveMarkup;
			}
			olMoves.insertAdjacentHTML("beforeend", `<li>${moveMarkup}</li>`);
		}
		olMoves.setAttribute("start", olMoves.children.length - 1);

		const gwShortsBody = document.getElementById("gwShortsBody");
		if(snapshotIdx) {
			Object.entries({
				"code_1": "Alt+M",
				"handler_1": `GW.Chessboard.writeToClipboard("${GW.Chessboard.Data.Moves[snapshotIdx - 1]}")`,
				"info_1": "Copy the current move to the clipboard",
			}).forEach(([attr, value]) => gwShortsBody.setAttribute(attr, value));
		}
		else {
			["code_1", "handler_1", "info_1"].forEach(attr => gwShortsBody.removeAttribute(attr));
		}
	}

	function renderBoardAtSnapshot (snapshot) {
		document.getElementById("theadBoard").innerHTML = `
		<tr>
			<td></td>
			<td></td>
			<th scope="col" colspan="${ORDERED_FILES.length}">File</th>
		</tr>
		<tr>
			<td></td>
			<td></td>
			${ORDERED_FILES.map(file => `<th scope="col">${file}</th>`).join("")}
		</tr>
		`;
		
		document.getElementById("tbodyBoard").innerHTML = ORDERED_RANKS.map(rank => `
		<tr>
			${RANK_ORDER_INDEX[rank] === 0
				? `<th scope="row" rowspan="${ORDERED_RANKS.length}" class="left-border"><span>Rank</span></th>`
				: ""
			}
			<th scope="row">${rank}</th>
			${ORDERED_FILES.map(file => `
			<td id="cell-${file}${rank}"
				aria-labelledby="${(RANK_ORDER_INDEX[rank] + FILE_ORDER_INDEX[file]) % 2 === 0
					? "spnSquareWhiteLabel"
					: "spnSquareBlackLabel"
				} spnIcon-${file}${rank}
				  spnMovable-${file}${rank}
				  spnThreatening-${file}${rank}
				  spnMoveToAble-${file}${rank}
				  spnThreatened-${file}${rank}
				  spnDoesCapture-${file}${rank}
				  spnInCheck-${file}${rank}
				  spnDoesCastle-${file}${rank}"
			>
				<button id="button-${file}${rank}"
					tabindex="-1"
					aria-labelledby="spnSquareBtnLabel"
					aria-pressed="false"
					class="board-square-button"
					onclick="GW.Chessboard.Rendering.onSquareClicked('${file}', '${rank}')"
				>
					<span id="spnIcon-${file}${rank}" class="icon-span">
						${snapshot[`${file}${rank}`] ? snapshot[`${file}${rank}`].Icon : ""}
					</span>
					<span id=spnMovable-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark movable"
							iconKey="person-running"
							title="Can move to the selected square"
						></gw-icon>
					</span>
					<span id=spnThreatening-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark threatening"
							iconKey="bolt"
							title="Can capture the selected square's piece"
						></gw-icon>
					</span>
					<span id=spnMoveToAble-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark move-to-able"
							iconKey="forward-step"
							title="The selected square's piece can move here"
						></gw-icon>
					</span>
					<span id=spnThreatened-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark threatened"
							iconKey="skull"
							title="Can be captured by the selected square's piece"
						></gw-icon>
					</span>
					<span id=spnDoesCapture-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark does-capture"
							iconKey="hand-fist"
							title="Moving the selected square's piece here performs a capture"
						></gw-icon>
					</span>
					<span id=spnInCheck-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark in-check"
							iconKey="triangle-exclamation"
							title="In check"
						></gw-icon>
					</span>
					<span id=spnDoesCastle-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark does-castle"
							iconKey="chess-rook"
							title="The selected square's piece moving here causes castling"
						></gw-icon>
					</span>
				</button>
			</td>
			`).join("")}
		</tr>
		`).join("");
		
		["white", "black"].forEach(color => {
			if(GW.Chessboard.Pieces.isTeamInCheck(snapshot, color)) {
				const king = Object.values(snapshot).filter(
					piece => piece.Name === "King" && piece.Color === color
				)[0];
				document.getElementById(`cell-${king.File}${king.Rank}`).classList.add("in-check");
			}
		});

		document.getElementById("tblBoard").setAttribute("tabindex", "0");
	}

	/**
	 * Handler for when the board gets focus
	 * @param {FocusEvent} event focus in
	 */
	ns.tblBoardOnFocusIn = (event) => {
		const tblBoard = document.getElementById("tblBoard");
		const tbodyBoard = document.getElementById("tbodyBoard");
		let curCellBtn = tbodyBoard.querySelector(`[tabindex="0"]`);
		let focusTarget = event.target;

		if(focusTarget === tblBoard) {
			tblBoard.removeAttribute("tabindex");
			focusTarget = tbodyBoard.querySelector(`button`);
		}

		if(curCellBtn !== focusTarget) {
			focusSquare(curCellBtn, focusTarget);
		}
	}

	/**
	 * Performs keyboard navigation in the board
	 * @param {KeyboardEvent} event Navigation event
	 */
	ns.tblBoardOnKbdNav = (event) => {
		const curCellBtn = tbodyBoard.querySelector(`[tabindex="0"]`);
		const curCell = curCellBtn.parentElement;
		const curFile = curCell.getAttribute("id")["cell-".length];
		const curRank = curCell.getAttribute("id")["cell-".length + 1];

		let targetCellLocation = "";
		switch(event.key) {
			case "ArrowRight":
				targetCellLocation = `${GW.Chessboard.getFile(curFile, 1)}${curRank}`;
				break;
			case "ArrowLeft":
				targetCellLocation = `${GW.Chessboard.getFile(curFile, -1)}${curRank}`;
				break;
			case "ArrowUp":
				targetCellLocation = `${curFile}${GW.Chessboard.getRank(curRank, -1)}`;
				break;
			case "ArrowDown":
				targetCellLocation = `${curFile}${GW.Chessboard.getRank(curRank, 1)}`;
				break;
			case "PageUp":
				targetCellLocation = `${curFile}${ORDERED_RANKS[0]}`;
				break;
			case "PageDown":
				targetCellLocation = `${curFile}${ORDERED_RANKS[ORDERED_RANKS.length - 1]}`;
				break;
			case "Home":
				if(event.ctrlKey) {
					targetCellLocation = `${ORDERED_FILES[0]}${ORDERED_RANKS[0]}`;
				}
				else {
					targetCellLocation = `${ORDERED_FILES[0]}${curRank}`;
				}
				break;
			case "End":
				if(event.ctrlKey) {
					targetCellLocation = `${ORDERED_FILES[ORDERED_FILES.length - 1]}${ORDERED_RANKS[ORDERED_RANKS.length - 1]}`;
				}
				else {
					targetCellLocation = `${ORDERED_FILES[ORDERED_FILES.length - 1]}${curRank}`;
				}
				break;
		}
		const targetCell = document.getElementById(`cell-${targetCellLocation}`);
		if(!targetCell) {
			return;
		}
		focusSquare(curCellBtn, targetCell.querySelector("button"));
	}

	/**
	 * Moves system focus to a specified cell
	 * @param {string} location Cell
	 */
	ns.moveFocusTo = (location) => {
		focusSquare(
			document.getElementById("tbodyBoard").querySelector(`button[aria-pressed="true"]`),
			document.getElementById(`cell-${location}`).querySelector("button")
		);
	}

	function focusSquare(prevCellBtn, newCellBtn) {
		if(!newCellBtn) { return; }

		prevCellBtn?.setAttribute("tabindex", -1);
		newCellBtn.setAttribute("tabindex", 0);
		newCellBtn.focus();
		document.getElementById("tblBoard").removeAttribute("tabindex");
	}

	/**
	 * Handling when a board square is clicked
	 * @param {string} file Clicked file location
	 * @param {string} rank Clicked rank location
	 */
	ns.onSquareClicked = (file, rank) => {
		const tbodyBoard = document.getElementById("tbodyBoard");
		const prevSelSquareBtn = tbodyBoard.querySelector(`button[aria-pressed="true"]`);
		const clickedBtnId = `button-${file}${rank}`;
		const clickedBtn = document.getElementById(clickedBtnId);
		const isClickedBtnMove = clickedBtn.getAttribute("aria-labelledby") === "spnSquareBtnMoveLabel";
		const doToggleOn = !isClickedBtnMove && clickedBtn.getAttribute("aria-pressed") !== "true";

		ns.cleanSelectionBasedState();

		if(doToggleOn) {
			clickedBtn.setAttribute("aria-pressed", "true");
			ns.calloutPiecesMovable(file, rank);
			ns.calloutPiecesThreatening(file, rank);
			ns.calloutPiecePath(file, rank);
			updateSelectionInfo(file, rank);
		}
		else if(isClickedBtnMove) {
			GW.Chessboard.Snapshots.initiateMove(
				prevSelSquareBtn.id.replace("button-", ""),
				`${file}${rank}`
			).then(() => {
				focusSquare(undefined, document.getElementById(clickedBtnId));
			});
		}
	}

	function updateSelectionInfo(file, rank) {
		const tdSelection = document.getElementById(`cell-${file}${rank}`);
		document.getElementById("spnSelInfoCell").innerText = `${file}${rank} (${
			tdSelection.getAttribute("aria-labelledby").includes("spnSquareWhiteLabel")
			? "white"
			: "black"
		})`;

		const tblBoard = document.getElementById("tblBoard");

		document.getElementById("ulSelInfoMoveable").innerHTML = Array.from(tblBoard.querySelectorAll(`td.movable`)).map(tdEl => {
			const loc = tdEl.id.replace("cell-", "");
			return `<li><a href="javascript:void(0)" onclick="GW.Chessboard.Rendering.moveFocusTo('${loc}')">${loc}</a></li>`
		}).join("");

		const piece = GW.Chessboard.Snapshots.List[ns.CurrentSnapshotIdx][`${file}${rank}`];
		if(piece) {
			document.getElementById("artSelInfoPiece").removeAttribute("hidden");

			document.getElementById("divSelInfoPieceName").innerText = `${piece.Color} ${piece.Name}`;
			document.getElementById("spnSelInfoPieceStart").innerText = `${piece.StartFile}${piece.StartRank}`;
			document.getElementById("spnSelInfoPieceMoveCount").innerText = `${piece.MoveCount}`;

			document.getElementById("ulSelInfoMoves").innerHTML = Array.from(tblBoard.querySelectorAll(`td.move-to-able`)).map(tdEl => {
				const loc = tdEl.id.replace("cell-", "");
				return `<li><a href="javascript:void(0)" onclick="GW.Chessboard.Rendering.moveFocusTo('${loc}')">${loc}</a></li>`
			}).join("");
			document.getElementById("ulSenInfoCaptures").innerHTML = Array.from(tblBoard.querySelectorAll(`td.threatened`)).map(tdEl => {
				const loc = tdEl.id.replace("cell-", "");
				return `<li><a href="javascript:void(0)" onclick="GW.Chessboard.Rendering.moveFocusTo('${loc}')">${loc}</a></li>`
			}).join("");
			document.getElementById("ulSelInfoThreatened").innerHTML = Array.from(tblBoard.querySelectorAll(`td.threatening`)).map(tdEl => {
				const loc = tdEl.id.replace("cell-", "");
				return `<li><a href="javascript:void(0)" onclick="GW.Chessboard.Rendering.moveFocusTo('${loc}')">${loc}</a></li>`
			}).join("");
		}
		else {
			document.getElementById("artSelInfoPiece").setAttribute("hidden", "true");
		}
	}

	/**
	 * Removes all selection from the board
	 * @param {Event} _event 
	 */
	ns.clearSelection = (_event) => {
		const tbodyBoard = document.getElementById("tbodyBoard");
		if(!tbodyBoard.querySelector(`button[aria-pressed="true"]:focus-within`)) {
			GW.Chessboard.invisibleAlert("Selection cleared");
		}

		ns.cleanSelectionBasedState();
	}

	/**
	 * Clears out DOM state from the board based on selection
	 */
	ns.cleanSelectionBasedState = function cleanSelectionBasedState() {
		document.getElementById("tbodyBoard").querySelectorAll("td").forEach(tdCell => {
			tdCell.classList.remove("movable");
			tdCell.classList.remove("threatening");
			tdCell.classList.remove("move-to-able");
			tdCell.classList.remove("threatened");
			tdCell.classList.remove("does-capture");
			tdCell.classList.remove("does-castle");
			
			const tdBtn = tdCell.querySelector("button");
			tdBtn.setAttribute("aria-pressed", false);
			tdBtn.setAttribute("aria-labelledby", "spnSquareBtnLabel");
		});
	}

	/**
	 * Applies DOM state for the pieces that can move to the specified square
	 * @param {string} file For file
	 * @param {string} rank For rank
	 */
	ns.calloutPiecesMovable = function calloutPiecesMovable(file, rank) {
		const snapshot = GW.Chessboard.Snapshots.List[ns.CurrentSnapshotIdx];
		Object.keys(snapshot).forEach(snapCell => {
			const tdCell = document.getElementById(`cell-${snapCell}`);
			if(snapshot[snapCell] && snapshot[snapCell].isValidMove(snapshot, file, rank)) {
				tdCell.classList.add("movable");
			}
			else {
				tdCell.classList.remove("movable");
			}
		});
	}

	/**
	 * Applies DOM state for the pieces threatening the specified cell
	 * @param {string} file For file
	 * @param {string} rank For rank
	 */
	ns.calloutPiecesThreatening = function calloutPiecesThreatening(file, rank) {
		const snapshot = GW.Chessboard.Snapshots.List[ns.CurrentSnapshotIdx];
		Object.keys(snapshot).forEach(snapCell => {
			const tdCell = document.getElementById(`cell-${snapCell}`);
			if(snapshot[snapCell] && snapshot[snapCell].canCapture(snapshot, file, rank)) {
				tdCell.classList.add("threatening");
			}
			else {
				tdCell.classList.remove("threatening");
			}
		});
	}

	/**
	 * Applies DOM state for the squres the specified square's piece can travel to
	 * @param {string} file For file
	 * @param {string} rank For rank
	 * @returns 
	 */
	ns.calloutPiecePath = function calloutPiecePath(file, rank) {
		const snapshot = GW.Chessboard.Snapshots.List[ns.CurrentSnapshotIdx];
		const piece = snapshot[`${file}${rank}`];
		if(!piece) { return; }

		const moves = piece.getMoves(snapshot);
		moves.forEach(move => {
			tdMoveCell = document.getElementById(`cell-${move.Cell}`);
			tdCaptureCell = document.getElementById(`cell-${move.Capture}`);
			if(tdMoveCell) {
				tdMoveCell.classList.add("move-to-able");

				if(ns.getCurrentMovingColor() === piece.Color) {
					const tdMoveBtn = tdMoveCell.querySelector("button");
					tdMoveBtn.removeAttribute("aria-pressed");
					tdMoveBtn.setAttribute("aria-labelledby", "spnSquareBtnMoveLabel");
				}
			}
			if(tdCaptureCell) {
				tdCaptureCell.classList.add("threatened");
				tdMoveCell.classList.add("does-capture");
			}
			if(move.CastleKS || move.CastleQS) {
				tdMoveCell.classList.add("does-castle");
			}
		});
	}
}) (window.GW.Chessboard.Rendering = window.GW.Chessboard.Rendering || {});