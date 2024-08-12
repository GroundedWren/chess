/**
 * @file Code for loading and saving games
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function LoadSave(ns) {
	const ORDERED_FILES = GW.Chessboard.ORDERED_FILES;
	const ORDERED_RANKS = GW.Chessboard.ORDERED_RANKS;
	const RANK_ORDER_INDEX = GW.Chessboard.RANK_ORDER_INDEX;
	const FILE_ORDER_INDEX = GW.Chessboard.FILE_ORDER_INDEX;

	ns.setSnapshot = (snapshotIdx) => {
		GW.Chessboard.CurrentSnapshotIdx = snapshotIdx;
		const snapshot = GW.Chessboard.Snapshots[snapshotIdx];
		renderBoardAtSnapshot(snapshot);
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
				  spnInCheck-${file}${rank}
				  spnMovable-${file}${rank}
				  spnThreatening-${file}${rank}
				  spnMoveToAble-${file}${rank}
				  spnThreatened-${file}${rank}
				  spnDoesCapture-${file}${rank}"
			>
				<button id="button-${file}${rank}"
					tabindex="-1"
					aria-labelledby="spnSquareBtnLabel"
					aria-pressed="false"
					onclick="GW.Chessboard.onSquareClicked('${file}', '${rank}')"
				>
					<span id="spnIcon-${file}${rank}" class="icon-span">
						${snapshot[`${file}${rank}`] ? snapshot[`${file}${rank}`].Icon : ""}
					</span>
					<span id=spnInCheck-${file}${rank} class="icon-span">
						<gw-icon
							class="earmark in-check"
							iconKey="triangle-exclamation"
							title="In check"
						></gw-icon>
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
	}

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

	function focusSquare(prevCellBtn, newCellBtn) {
		if(!newCellBtn) { return; }

		prevCellBtn?.setAttribute("tabindex", -1);
		newCellBtn.setAttribute("tabindex", 0);
		newCellBtn.focus();
	}

	ns.cleanSelectionBasedClasses = function cleanSelectionBasedClasses() {
		document.getElementById("tbodyBoard").querySelectorAll("td").forEach(tdCell => {
			tdCell.classList.remove("movable");
			tdCell.classList.remove("threatening");
			tdCell.classList.remove("move-to-able");
			tdCell.classList.remove("threatened");
			tdCell.classList.remove("does-capture");
			tdCell.classList.remove("in-check");
		});
	}

	ns.calloutPiecesMovable = function calloutPiecesMovable(file, rank) {
		const snapshot = GW.Chessboard.Snapshots[GW.Chessboard.CurrentSnapshotIdx];
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

	ns.calloutPiecesThreatening = function calloutPiecesThreatening(file, rank) {
		const snapshot = GW.Chessboard.Snapshots[GW.Chessboard.CurrentSnapshotIdx];
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

	ns.calloutPiecePath = function calloutPiecePath(file, rank) {
		const snapshot = GW.Chessboard.Snapshots[GW.Chessboard.CurrentSnapshotIdx];
		const piece = snapshot[`${file}${rank}`];
		if(!piece) { return; }

		const moves = piece.getMoves(snapshot);
		moves.forEach(move => {
			tdMoveCell = document.getElementById(`cell-${move.Cell}`);
			tdCaptureCell = document.getElementById(`cell-${move.Capture}`);
			if(tdMoveCell) {
				tdMoveCell.classList.add("move-to-able");
			}
			if(tdCaptureCell) {
				tdCaptureCell.classList.add("threatened");
				tdMoveCell.classList.add("does-capture");
			}
		});
	}
}) (window.GW.Chessboard.Rendering = window.GW.Chessboard.Rendering || {});