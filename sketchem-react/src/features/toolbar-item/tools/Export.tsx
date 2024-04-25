import * as ToolsConstants from "@constants/tools.constants";
import * as KekuleUtils from "@src/utils/KekuleUtils";
import styles from "@styles/index.module.scss";
import { exportFileFromMolecule } from "@utils/KekuleUtils";
import clsx from "clsx";
import React, { useState } from "react";
import { Button, Container, Form, Modal, Row } from "react-bootstrap";

import { DialogProps, ToolbarItemButton } from "../ToolbarItem";
import { RegisterToolbarButtonWithName } from "../ToolsButtonMapper.helper";
import { RegisterToolbarWithName } from "./ToolsMapper.helper";

function SupportedFiles(props: any) {
    /**
     * The options array should contain objects.
     * Required keys are "name" and "value" but you can have and use any number of key/value pairs.
     */
    const { selectOptions, initialFormat, onFormatChange } = props;

    return (
        //
        <Form.Select value={initialFormat} onChange={(e: any) => onFormatChange(e.target.value)}>
            {selectOptions.map((element: any) => (
                <option value={element.value} key={element.value}>
                    {element.name}
                </option>
            ))}
        </Form.Select>
    );
}

// eslint-disable-next-line react/no-unused-prop-types, @typescript-eslint/no-unused-vars, no-unused-vars
function ExportFile(props: DialogProps & { title: string }) {
    const { onHide, editor } = props;
    const [format, setFormat] = useState("mol");
    const [contentRE, setContentRE] = useState<string>("result");
    const [loading, setLoading] = useState(false);

    const loadText = async (download: boolean) => {
        if (editor.isEmpty()) {
            onHide();
            return;
        }
        editor.updateAllKekuleNodes();
        const content = exportFileFromMolecule("inchi");
        // if (download) {
        //     const blob = new Blob([content], { type: "text/plain" });
        //     const url = window.URL.createObjectURL(blob);
        //     const link = document.createElement("a");
        //     link.href = url;
        //     link.download = `sketChem_mol.${format}`;
        //     link.click();
        //     window.URL.revokeObjectURL(url);
        // } else {

        try {
            const formatData = {
                inchi: content.trim(),
            };
            setLoading(true);
            const response = await fetch("https://api.rsc.org/compounds/v1/filter/inchi", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: "YLh7MReG3OfaKAqmuMj8d40rdGMVtJA3",
                },
                body: JSON.stringify(formatData),
            })
                .then((res) => res.json())
                .then((data) => {
                    fetch(`https://api.rsc.org/compounds/v1/filter/${data.queryId}/results`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: "YLh7MReG3OfaKAqmuMj8d40rdGMVtJA3",
                        },

                        // body: JSON.stringify(formatData),
                    })
                        .then((ress) => ress.json())
                        .then((data2) => {
                            console.log(data2);
                            if (data2.results.length !== 0) {
                                fetch(
                                    `https://api.rsc.org/compounds/v1/records/${data2.results[0]}/details?fields=CommonName`,
                                    {
                                        method: "GET",
                                        headers: {
                                            "Content-Type": "application/json",
                                            apikey: "YLh7MReG3OfaKAqmuMj8d40rdGMVtJA3",
                                        },
                                    }
                                )
                                    .then((resss) => resss.json())
                                    .then((data3) => {
                                        console.log(data3);
                                        setContentRE(data3.commonName);
                                        setLoading(false);
                                    });
                            } else {
                                alert("Atom error");
                                setLoading(false);

                                onHide();
                            }
                        });
                });
        } catch (error) {
            console.error("Error:", error);
        }
        navigator.clipboard.writeText(content);
        // }
        // onHide();
    };

    const options = KekuleUtils.getSupportedWriteFormats();
    // console.log(options);

    return (
        <>
            <Modal.Body className="show-grid">
                <Container fluid>
                    <Row>
                        {/* <SupportedFiles selectOptions={options} onFormatChange={setFormat} initialFormat={format} /> */}
                        type file: inchi
                        <br />
                        <div>{!loading ? contentRE : "...loading"}</div>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <div className="me-auto">
                    {/* Todo!! actually replace or add the molecule on the canvas */}
                    {/* <Button className="m-2" onClick={() => loadText(true)}>
                        Download
                    </Button> */}
                    <Button className="m-2" onClick={() => loadText(false)}>
                        enter
                    </Button>
                </div>
                <Button className="m-2" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </>
    );
}

export function DialogLoadWindow(props: DialogProps) {
    const [modalShow, setModalShow] = useState(true);
    const { onHide, editor } = props;

    const hideMe = () => {
        setModalShow(false);
        onHide();
    };

    return (
        <Modal
            show={modalShow}
            // size="xl"
            dialogClassName={clsx(styles.export_dialog)}
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <ExportFile onHide={hideMe} editor={editor} title="From Paste" />
        </Modal>
    );
}

RegisterToolbarWithName(ToolsConstants.ToolsNames.Export, {
    DialogRender: DialogLoadWindow,
});

const Export: ToolbarItemButton = {
    name: "Export",
    toolName: ToolsConstants.ToolsNames.Export,
    keyboardKeys: ToolsConstants.ToolsShortcutsMapByToolName.get(ToolsConstants.ToolsNames.Export),
};

RegisterToolbarButtonWithName(Export);

export default Export;
