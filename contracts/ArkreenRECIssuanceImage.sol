// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./libraries/FormattedStrings.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/BytesLib.sol";

import "./ArkreenBadgeType.sol";

// Import this file to use console.log
// import "hardhat/console.sol";

contract ArkreenRECIssuanceImage {
 
    using Strings for uint128;
    using Strings for uint256;
    using Strings for address;
    using FormattedStrings for uint256;
    using BytesLib for bytes;

    function _decimalTruncate(string memory _str, uint256 decimalDigits) internal pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        uint256 dotIndex = strBytes.length;

        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == ".") {

                if(i + decimalDigits + 1 < strBytes.length){
                    dotIndex = i + decimalDigits + 1;
                }
                break;
            }
        }

        bytes memory result = new bytes(dotIndex);
        for (uint256 i = 0; i < dotIndex; i++) {
            result[i] = strBytes[i];
        }

        return string(result);
    }

    function toFixedPoint(uint256 value, uint256 decimal) internal pure returns (string memory) {
        require(decimal <= 18, "Strings: Fixed point too long");
        string memory valueString = value.toString();
        
        if (decimal == 0) return valueString;

        bytes memory valueBytes = bytes(valueString);
        uint256 length = valueBytes.length;

        bytes memory resulInBytes;
        if (length > decimal) {
            resulInBytes = valueBytes.slice(0, length - decimal).concat(".")                // Integer part
                                .concat(valueBytes.slice(length - decimal, decimal));       // Decimal part
        } else {
            resulInBytes = bytes("0.000000000000000000").slice(0, decimal + 2 - length)     // Maximum 18 decimals
                                .concat(valueBytes);
        }
        return string(resulInBytes);
    }

    function getBadgeSVG(
        uint256 tokenId,
        OffsetRecord calldata offsetRecord,
        uint256 actionType,
        uint256[] calldata idsOfAREC
    ) external view returns(string memory) {

        bytes memory dataURI;
        string memory tokenString = tokenId.toString();

        {
            string memory energyInBadge = _decimalTruncate(toFixedPoint(offsetRecord.offsetTotalAmount, 9), 3);
            address beneficiary = offsetRecord.beneficiary;
            if (beneficiary == address(0))  beneficiary = offsetRecord.offsetEntity;

            string memory svgData = getBadgeSVGImage(beneficiary.toHexString(), energyInBadge);

            dataURI = abi.encodePacked(
                            '{"name":"ArkreenClimateBadge #',
                            tokenString,
                            '","description":"',
                            'Proof of the climate actions for carbon offset.',
                            '","image":"data:image/svg+xml;base64,',
                            svgData,
                            '","attributes":[{"display_type":"number","trait_type":"AREC Badge ID","value":',
                            tokenString,
                            '},{"trait_type":"Renewable Energy","value":"',
                            energyInBadge,
                            ' kWh"},{"display_type":"date","trait_type":"AREC Badge Time","value":',
                            offsetRecord.creationTime.toString(),
                            '},'       
                        );
        }

        {
            string memory typeAction;
            if (actionType == 1) { 
                typeAction ='Redeem';
            } else if (actionType == 2) {
                typeAction = 'Offset';
            } else {
                typeAction = 'Redeem,Offset';
            }

            dataURI = abi.encodePacked(dataURI,
                            '{"trait_type":"Climate Action Type","value":"',
                            typeAction,
                            '"},{"display_type":"number","trait_type":"Climate Action Number","value":',
                            offsetRecord.offsetIds.length.toString(),
                            '},'
                        );
        }

        {
            bytes memory actionIds;
            for (uint256 index=0; index < offsetRecord.offsetIds.length; index++) {
                if (index == 0) actionIds = bytes(offsetRecord.offsetIds[0].toString());
                else actionIds = actionIds.concat(",").concat(bytes(offsetRecord.offsetIds[index].toString()));
            }
        
            dataURI = abi.encodePacked(dataURI,
                            '{"trait_type":"Climate Action IDs","value":"',
                            string(actionIds),
                            '"},'
                        );
        }

        {
            bytes memory arecNftIds;
            for (uint256 index=0; index < idsOfAREC.length; index++) {
                if (index==0) arecNftIds = bytes(idsOfAREC[0].toString());
                else arecNftIds = arecNftIds.concat(",").concat(bytes(idsOfAREC[index].toString()));
            }
        
            dataURI = abi.encodePacked(dataURI,
                            '{"trait_type":"Retired AREC NFTs","value":"',
                            string(arecNftIds),
                            '"},'
                        );
        }

        {
            bytes memory bytesBadgeFile = 'https://arec.arkreen.com/badges/AREC_Badge_000000.pdf';
            bytes memory tokenInBytes = bytes(tokenString);
            bytes memory BadgeFile = bytesBadgeFile.slice(0, bytesBadgeFile.length - 4 - tokenInBytes.length)
                                        .concat(tokenInBytes.concat('.pdf'));

            dataURI = abi.encodePacked(dataURI,
                            '{"trait_type":"AREC Badge File","value":"',
                            string(BadgeFile),
                            '"}]}'
                        );
        }

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(dataURI)));
    }

    function getBadgeSVGImage(string memory beneficiary, string memory energyInBadge) internal pure returns(string memory) {

        bytes memory imgBytes = abi.encodePacked(

            '<svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
                '<defs>'
                    '<path id="center" d="M0 20 800 20" stroke="white" fill="none"/>'
                '</defs>'
                '<path fill="#fff" d="M.5.5h899v743H.5z"/>'
                '<path stroke="#2F2F34" d="M.5.5h899v743H.5z"/>'
                '<path stroke="#DBDBE4" d="M24.5 24.5h851v695h-851z"/>'
                '<path stroke="#DBDBE4" d="M32.5 32.5h835v679h-835z"/>'
                '<path d="M377.551 334l4.992-11.2h2.56l5.008 11.2h-2.72l-4.096-9.888h1.024L380.207 334h-2.656zm2.496-2.4l.688-1.968h5.76l.704'
                    ' 1.968h-7.152zm11.05 2.4v-8.608h2.384v2.432l-.336-.704a2.727 2.727 0 011.232-1.376c.566-.32 1.254-.48'
                    ' 2.064-.48v2.304a2.803 2.803 0 00-.288-.016 2.129 2.129 0 00-.272-.016c-.682 0-1.237.197-1.664.592-.416.384-.624.987-.624'
                    ' 1.808V334h-2.496zm8.908-1.76l.064-3.04 4.016-3.808h2.976l-3.856 3.92-1.296 1.056-1.904 1.872zm-2.064'
                    ' 1.76v-11.872h2.496V334h-2.496zm6.416 0l-2.912-3.616 1.568-1.936 4.368 5.552h-3.024zm4.1 0v-8.608h2.384v2.432l-.336-.704a2.722'
                    ' 2.722 0 011.232-1.376c.565-.32 1.253-.48 2.064-.48v2.304a2.833 2.833 0 00-.288-.016 2.14 2.14 0 00-.272-.016c-.683'
                    ' 0-1.238.197-1.664.592-.416.384-.624.987-.624 1.808V334h-2.496zm11.037.128c-.981'
                    ' 0-1.845-.192-2.592-.576-.736-.384-1.306-.907-1.712-1.568-.405-.672-.608-1.435-.608-2.288'
                    ' 0-.864.198-1.627.592-2.288a4.24 4.24 0 011.648-1.568c.694-.384 1.478-.576 2.352-.576.843 0 1.6.181'
                    ' 2.272.544a3.925 3.925 0 011.616 1.536c.395.661.592 1.456.592 2.384 0'
                    ' .096-.005.208-.016.336-.01.117-.021.229-.032.336h-6.992v-1.456h5.68l-.96.432c0-.448-.09-.837-.272-1.168a1.924'
                    ' 1.924 0 00-.752-.768 2.134 2.134 0 00-1.12-.288c-.426 0-.805.096-1.136.288a1.91 1.91'
                    ' 0 00-.752.784c-.181.331-.272.725-.272 1.184v.384c0 .469.102.885.304 1.248.214.352.507.624.88.816.384.181.832.272'
                    ' 1.344.272.459 0 .859-.069 1.2-.208a2.93 2.93 0 00.96-.624l1.328 1.44a3.93 3.93 0 01-1.488'
                    ' 1.04c-.597.235-1.285.352-2.064.352zm10.094 0c-.981 0-1.845-.192-2.592-.576-.736-.384-1.307-.907-1.712-1.568-.405-.672-.608-1.435-.608-2.288'
                    ' 0-.864.197-1.627.592-2.288a4.233 4.233 0 011.648-1.568c.693-.384 1.477-.576 2.352-.576.843 0 1.6.181 2.272.544a3.93'
                    ' 3.93 0 011.616 1.536c.395.661.592 1.456.592 2.384 0 .096-.005.208-.016.336l-.032.336h-6.992v-1.456h5.68l-.96.432c0-.448-.091-.837-.272-1.168a1.924'
                    ' 1.924 0 00-.752-.768 2.134 2.134 0 00-1.12-.288 2.22 2.22 0 00-1.136.288c-.32.181-.571.443-.752.784-.181.331-.272.725-.272 1.184v.384c0'
                    ' .469.101.885.304 1.248.213.352.507.624.88.816.384.181.832.272 1.344.272.459 0 .859-.069 1.2-.208a2.93 2.93'
                    ' 0 00.96-.624l1.328 1.44a3.946 3.946 0 01-1.488 1.04c-.597.235-1.285.352-2.064.352zm11.054-8.864c.682 0 1.29.139'
                    ' 1.824.416.544.267.97.683 1.28 1.248.309.555.464 1.269.464 2.144V334h-2.496v-4.544c0-.693-.155-1.205-.464-1.536-.299-.331-.726-.496-1.28-.496-.395'
                    ' 0-.752.085-1.072.256-.31.16-.555.411-.736.752-.171.341-.256.779-.256 1.312V334h-2.496v-8.608h2.384v2.384l-.448-.72a3.185'
                    ' 3.185 0 011.328-1.328c.576-.309 1.232-.464 1.968-.464zM451.18 334v-11.2h2.144l6.608 8.064h-1.04V322.8h2.56V334h-2.128l-6.624-8.064h1.04V334h-2.56zm17.017.128c-.981'
                    ' 0-1.845-.192-2.592-.576-.736-.384-1.306-.907-1.712-1.568-.405-.672-.608-1.435-.608-2.288 0-.864.198-1.627.592-2.288a4.24'
                    ' 4.24 0 011.648-1.568c.694-.384 1.478-.576 2.352-.576.843 0 1.6.181 2.272.544a3.925 3.925 0 011.616 1.536c.395.661.592'
                    ' 1.456.592 2.384 0 .096-.005.208-.016.336-.01.117-.021.229-.032.336h-6.992v-1.456h5.68l-.96.432c0-.448-.09-.837-.272-1.168a1.924'
                    ' 1.924 0 00-.752-.768 2.134 2.134 0 00-1.12-.288c-.426 0-.805.096-1.136.288a1.91 1.91 0 00-.752.784c-.181.331-.272.725-.272'
                    ' 1.184v.384c0 .469.102.885.304 1.248.214.352.507.624.88.816.384.181.832.272 1.344.272.459 0 .859-.069 1.2-.208a2.93'
                    ' 2.93 0 00.96-.624l1.328 1.44a3.93 3.93 0 01-1.488 1.04c-.597.235-1.285.352-2.064.352zm9.342'
                    ' 0c-1.013 0-1.802-.256-2.368-.768-.565-.523-.848-1.296-.848-2.32v-7.552h2.496v7.52c0 .363.096.645.288.848.192.192.454.288.784.288.395'
                    ' 0 .731-.107 1.008-.32l.672 1.76c-.256.181-.565.32-.928.416-.352.085-.72.128-1.104.128zm-4.544-6.624v-1.92h5.968v1.92h-5.968zm9.789'
                    ' 6.496l-3.104-8.608h2.352l2.576 7.408h-1.12l2.688-7.408h2.112l2.608 7.408h-1.12l2.656-7.408h2.208L491.52'
                    ' 334h-2.416l-2.288-6.352h.736L485.184 334h-2.4zm16.878.128c-.917 0-1.733-.192-2.448-.576a4.486 4.486'
                    ' 0 01-1.68-1.568c-.405-.672-.608-1.435-.608-2.288 0-.864.203-1.627.608-2.288a4.319 4.319 0 011.68-1.568c.715-.384 1.531-.576'
                    ' 2.448-.576.907 0 1.717.192 2.432.576a4.212 4.212 0 011.68 1.552c.405.661.608 1.429.608 2.304 0 .853-.203 1.616-.608'
                    ' 2.288a4.329 4.329 0 01-1.68 1.568c-.715.384-1.525.576-2.432.576zm0-2.048a2.19 2.19 0 001.12-.288c.331-.192.592-.464.784-.816.192-.363.288-.789.288-1.28 0-.501-.096-.928-.288-1.28a2.061'
                    ' 2.061 0 00-.784-.816 2.19 2.19 0 00-1.12-.288 2.19 2.19 0 00-1.12.288 2.178 2.178 0 00-.8.816c-.192.352-.288.779-.288'
                    ' 1.28 0 .491.096.917.288 1.28.203.352.469.624.8.816a2.19 2.19 0 001.12.288zm6.388 1.92v-8.608h2.384v2.432l-.336-.704a2.727'
                    ' 2.727 0 011.232-1.376c.566-.32 1.254-.48 2.064-.48v2.304a2.803 2.803 0 00-.288-.016 2.129 2.129 0 00-.272-.016c-.682 0-1.237.197-1.664.592-.416.384-.624.987-.624 1.808V334h-2.496zm8.908-1.76l.064-3.04 4.016-3.808h2.976l-3.856'
                    ' 3.92-1.296 1.056-1.904 1.872zm-2.064 1.76v-11.872h2.496V334h-2.496zm6.416 0l-2.912-3.616 1.568-1.936 4.368 5.552h-3.024z"'
                    ' fill="#2F2F34"/>'
                '<g>'
                    '<path d="M448.122 407.263l-26.333 42.173c-2.529 4.051.38 9.314 5.151 9.314h93.464c5.368 0 8.641-5.911'
                        ' 5.797-10.47l-67.13-107.526c-4.165-6.672-13.86-6.672-18.037 0l-67.851 108.682c-2.529 4.051.38 9.314'
                        ' 5.151 9.314h15.173a4.553 4.553 0 003.863-2.144l50.752-81.301a2.273 2.273 0 011.933-1.074 2.276 2.276'
                        ' 0 011.933 1.074l34.72 55.617a2.284 2.284 0 01.067 2.32 2.274 2.274 0 01-1.997 1.178h-20.84a2.283'
                        ' 2.283 0 01-2.267-2.344 2.28 2.28 0 01.345-1.146l1.614-2.593a2.283 2.283 0 000-2.418l-11.642-18.648a2.283'
                        ' 2.283 0 00-1.931-1.078 2.277 2.277 0 00-1.935 1.07z"'
                        ' fill="#202024" opacity=".05"/>'
                    '<path d="M482 88c0 17.673-14.327 32-32 32-17.673 0-32-14.327-32-32 0-17.673 14.327-32 32-32 17.673 0'
                        ' 32 14.327 32 32z" fill="#00913A"/>'
                    '<path d="M449.53 87.816l-6.583 10.543c-.632 1.013.095 2.329 1.288 2.329h23.366c1.342 0 2.16-1.478'
                        ' 1.449-2.618L452.268 71.19c-1.042-1.668-3.465-1.668-4.509 0l-16.963 27.17c-.632 1.013.095'
                        ' 2.329 1.288 2.329h3.793c.193-.001.383-.05.552-.143a1.15 1.15 0 00.414-.394l12.687-20.325a.573.573'
                        ' 0 01.967 0l8.68 13.905a.575.575 0 01.017.58.568.568 0 01-.5.294h-5.21a.57.57'
                        ' 0 01-.48-.873l.404-.648a.575.575 0 000-.604l-2.911-4.662a.566.566 0 00-.759-.199.574.574'
                        ' 0 00-.208.197z" fill="#fff"/>'
                    '<path d="M56 188.5h1.99v-1H56v1zm5.97 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.98v1zm7.959 0h3.979v-1h-3.979v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1H253v1zm7.96 0h3.979v-1h-3.979v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0H647v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96 0h3.979v-1h-3.979v1zm7.959'
                        ' 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.96'
                        ' 0h3.979v-1h-3.979v1zm7.959 0h3.98v-1h-3.98v1zm7.96 0h3.98v-1h-3.98v1zm7.959 0h3.98v-1h-3.98v1zm7.96'
                        ' 0H844v-1h-1.99v1zM56 189h1.99v-2H56v2zm5.97 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959'
                        ' 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.98v2zm7.959 0h3.979v-2h-3.979v2zm7.959'
                        ' 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2H253v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0H647v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.96 0h3.979v-2h-3.979v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0h3.98v-2h-3.98v2zm7.959 0h3.98v-2h-3.98v2zm7.96 0H844v-2h-1.99v2z"'
                        ' fill="#DBDBE4"/>'
                    '<path d="M844 627.5h-1.99v1H844v-1zm-5.97 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1H647v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0H253v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.979v1h3.979v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.96 0H77.89v1h3.98v-1zm-7.959 0h-3.98v1h3.98v-1zm-7.96 0h-3.98v1h3.98v-1zm-7.959 0H56v1h1.99v-1zM844 627h-1.99v2H844v-2zm-5.97 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2H647v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0H253v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.979v2h3.979v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.96 0H77.89v2h3.98v-2zm-7.959 0h-3.98v2h3.98v-2zm-7.96 0h-3.98v2h3.98v-2zm-7.959 0H56v2h1.99v-2z"'
                        ' fill="#DBDBE4"/>'
                    '<path d="M286 670h88" stroke="#DBDBE4"/>'
                    '<path d="M500.115 658.183l-2.318-.858c-.201-.08-.443.04-.524.24-.081.2.04.441.242.521l1.347.498-1.307.462c-.201.08-.322.32-.241.52.04.16.201.28.362.28.041 0 .081 0 .162-.04l2.274-.803a.354.354 0 00.23-.117.404.404 0 00.116-.441.437.437 0 00-.343-.262zM491.71 661.408c-.161 0-.282-.081-.363-.241-.08-.2 0-.44.202-.52l2.338-1.041a.45.45 0 01.323 0 .359.359 0 01.201.201.426.426 0 010 .32l-1.088 2.241a.432.432 0 01-.363.24c-.04 0-.121 0-.161-.04-.202-.08-.282-.32-.202-.52l.622-1.28-1.348.599c-.04.041-.08.041-.161.041zM432.17 682.1c.846.4 1.693.6 2.62.6a9.1 9.1 0 001.371-.12c.483-.08.806-.16.967-.24v-.801c-.443-.08-.927-.36-1.451-.76-.484-.4-1.048-1.001-1.613-1.801l-4.394-5.924 3.185-3.962a4.933 4.933 0 011.532-1.281c.524-.28 1.129-.4 1.774-.4v-.88h-.645c-1.169 0-2.097.24-2.742.68-.645.44-1.33 1.081-2.015 1.921l-3.991 5.003v-9.606c0-1.12-.121-2.001-.282-2.641-.161-.641-.444-1.081-.887-1.361s-1.048-.4-1.814-.4h-3.951v1h.323c1.008 0 1.612.321 1.895.921.282.6.403 1.441.403 2.441v17.851h4.273v-6.604l3.144 4.242c.726 1.041 1.492 1.721 2.298 2.122z"'
                        ' fill="#00913A"/>'
                    '<path fillRule="evenodd" clipRule="evenodd"'
                        ' d="M397.784 682.7c-.927 0-1.733-.12-2.459-.32-.685-.24-1.29-.521-1.774-.921a3.81 3.81 0 01-1.088-1.441 4.74 4.74 0 01-.363-1.881c0-1.08.242-2.001.766-2.761.484-.761 1.411-1.321 2.701-1.721 1.29-.401 3.144-.601 5.523-.601h.483c0-1.361-.121-2.441-.362-3.242-.242-.8-.605-1.361-1.089-1.681a3.025 3.025 0 00-1.693-.52c-.766 0-1.411.2-2.016.56-.604.401-1.048 1.201-1.29 2.482h-1.814c0-.601.041-1.201.121-1.801a2.93 2.93 0 01.726-1.601c.403-.44 1.048-.761 1.975-.921a17.81 17.81 0 013.024-.24c1.088 0 2.056.16 2.902.44.847.281 1.572.721 2.137 1.321.604.6 1.048 1.321 1.33 2.241.282.881.443 1.962.443 3.162v9.166h-2.822l-1.169-1.521h-.161c-.282.48-.766.92-1.451 1.281a6.44 6.44 0 01-2.58.52zm1.008-1.721c.725 0 1.33-.24 1.814-.761.484-.48.806-1 1.008-1.48v-4.203h-.524c-1.613 0-2.742.28-3.427.881-.685.6-1.048 1.48-1.048 2.681 0 .961.202 1.681.564 2.161.403.481.928.721 1.613.721z"'
                        ' fill="#00913A"/>'
                    '<path'
                        ' d="M410.119 682.34v-11.447c0-1.001-.121-1.841-.403-2.442-.282-.6-.887-.92-1.894-.92h-.283v-1.001h3.266c.766 0 1.33.08 1.773.28.444.201.766.521 1.008.961.403-.36.927-.72 1.613-1.081.685-.36 1.532-.52 2.539-.52.484 0 .927.04 1.331.16.403.12.725.28 1.007.52.363.281.645.601.847.961.171.34.255.507.277.525l-1.688 1.316c-.202-.28-.484-.6-.887-.88a2.358 2.358 0 00-1.411-.441c-.685 0-1.29.12-1.773.32-.484.201-.887.441-1.169.761l.024.24c.031.29.056.53.056.721.04.24.04.48.04.64v11.327h-4.273zM421.205 668.331l-.005.005c.003.003.005.001.005-.005zM440.071 682.34v-11.447c0-1.001-.121-1.841-.403-2.442-.282-.6-.887-.92-1.895-.92h-.322v-1.001h3.265c.766 0 1.33.08 1.774.28.443.201.766.521 1.007.961.404-.36.928-.72 1.613-1.081.685-.36 1.532-.52 2.54-.52.483 0 .927.04 1.33.16s.725.28 1.008.52c.362.281.645.601.846.961.171.34.255.507.277.525l-1.688 1.316c-.201-.28-.484-.6-.887-.88a2.358 2.358 0 00-1.411-.441c-.685 0-1.29.12-1.773.32-.484.201-.887.441-1.169.761l.025.24c.03.29.055.531.055.721.041.24.041.48.041.64v11.327h-4.233zM451.116 668.331l-.005.005c.004.003.005.001.005-.005z"'
                        ' fill="#00913A"/>'
                    '<path fillRule="evenodd" clipRule="evenodd"'
                        ' d="M454.664 681.619c1.169.721 2.499 1.081 4.031 1.081 1.209 0 2.217-.2 3.104-.641.806-.4 1.451-.84 1.975-1.4.524-.561.927-1.081 1.25-1.561l-1.008-.761c-.564.801-1.209 1.481-1.935 2.001-.726.521-1.653.801-2.782.801-1.088 0-1.935-.48-2.62-1.401s-1.008-2.481-1.008-4.723h9.917l.121-2.121c0-1.321-.323-2.521-.967-3.522a6.755 6.755 0 00-2.621-2.361c-1.128-.561-2.338-.841-3.708-.841-1.371 0-2.621.32-3.709.961-1.129.6-1.975 1.52-2.62 2.761-.645 1.201-.968 2.722-.968 4.523 0 1.601.323 3.002.927 4.242a7.206 7.206 0 002.621 2.962zm6.49-8.085h-5.604c0-1.481.162-2.641.404-3.522.282-.84.604-1.441 1.048-1.801.443-.36.887-.52 1.37-.52.807 0 1.492.4 2.016 1.241.524.84.766 2.361.766 4.602zM475.061 682.7c-1.531 0-2.862-.36-4.031-1.081a7.204 7.204 0 01-2.62-2.962c-.605-1.24-.927-2.641-.927-4.242 0-1.801.322-3.322.967-4.523.645-1.241 1.492-2.161 2.621-2.761 1.088-.641 2.338-.961 3.708-.961 1.371 0 2.58.28 3.709.841a6.76 6.76 0 012.62 2.361c.645 1.001.968 2.201.968 3.522l-.121 2.121h-9.917c0 2.242.322 3.802 1.008 4.723.685.921 1.532 1.401 2.62 1.401 1.129 0 2.056-.28 2.782-.801.725-.52 1.37-1.2 1.934-2.001l1.008.761c-.322.48-.725 1-1.249 1.561-.524.56-1.169 1-1.976 1.4-.886.441-1.894.641-3.104.641zm-3.144-9.166h5.603c0-2.241-.241-3.762-.766-4.602-.524-.841-1.209-1.241-2.015-1.241-.484 0-.927.16-1.371.52-.443.36-.766.961-1.048 1.801-.242.881-.403 2.041-.403 3.522z"'
                        ' fill="#00913A"/>'
                    '<path'
                        ' d="M485.26 670.893v11.447h4.354v-13.648a3.955 3.955 0 011.169-.601c.443-.16 1.007-.24 1.612-.24.605 0 1.169.16 1.613.44.443.28.806.761 1.088 1.401.282.681.403 1.521.403 2.642v10.006h4.273v-9.966c0-1.481-.242-2.642-.725-3.562-.484-.921-1.169-1.561-2.097-2.002-.927-.44-2.096-.64-3.466-.64-1.331 0-2.379.2-3.104.52-.726.321-1.29.681-1.693 1.081-.242-.44-.565-.76-1.008-.961-.444-.2-1.008-.28-1.774-.28h-3.265v1.001h.322c1.008 0 1.613.32 1.895.92.282.601.403 1.441.403 2.442zM504.488 661.064l-1.289-.617c-.202-.08-.443 0-.524.2-.081.2 0 .44.202.52l2.189 1.048a.33.33 0 00.092.05.308.308 0 00.137.023h.004c.041 0 .118-.001.157-.04a.36.36 0 00.202-.2.408.408 0 00.029-.205.422.422 0 00-.029-.115l-1.048-2.322c-.081-.2-.323-.28-.524-.2-.202.08-.282.32-.202.52l.604 1.338zM506.198 667.792a.427.427 0 00.259.417l.043.019a.29.29 0 00.125.023c.053 0 .089 0 .119-.011a.287.287 0 00.195-.134.421.421 0 00.114-.308l.822-2.188c.08-.2-.04-.441-.242-.521-.202-.08-.443.04-.524.241l-.474 1.262-.453-1.262c-.081-.201-.323-.321-.524-.241-.202.08-.323.321-.242.521l.782 2.182zM503.002 673.224l-.005-.01a.42.42 0 01-.027-.213.41.41 0 01.027-.107l1.089-2.241c.08-.2.322-.28.524-.2.201.08.282.32.201.52l-.616 1.27 1.302-.59c.201-.08.443 0 .524.201.08.2 0 .44-.202.52l-2.211.984a.402.402 0 01-.248.097c-.033 0-.095 0-.138-.023a.355.355 0 01-.13-.084.366.366 0 01-.09-.124z"'
                        ' fill="#00913A"/>'
                    '<path d="M526 670h88" stroke="#DBDBE4"/>'
                '</g>'
                '<defs>'
                    '<path id="center" d="M0 20 800 20" stroke="white" fill="none"/>'
                '</defs>'
                '<g transform="translate(50,130)">'
                    '<text font-family="Montserrat" font-size="24px" font-weight="700" fill="#202024" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                          'ARKREEN RENEWABLE ENERGY CERTIFICATE'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,200)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'This certificate is issued to the account on Polygon of'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,240)">'
                    '<rect width="800" height="40"/>'
                    '<text font-family="Montserrat" font-size="16px" font-weight="700" fill="#2f2f34" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                          'issuer'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,272)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                          'by'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,344)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'confirming the issuance of'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,384)">'
                    '<rect width="800" height="40" />'
                    '<text font-family="Montserrat" font-size="32px" font-weight="700" fill="#202024" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                          '{Number(art/1000000000).toFixed(4)}'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,418)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'AREC certificates, representing {Number(art/1000000000).toFixed(3)}MWh of electricity generated from renewable sources, in the blockchain transaction'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,444)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="700" fill="#2f2f34" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                          '{tx}'
                      '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,470)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'This certificate relates to the electricity generation located at or in'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,504)">'
                    '<rect width="800" height="40"/>'
                    '<text font-family="Montserrat" font-size="16px" font-weight="700" fill="#2f2f34" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            '{region?region.replace("China","Mongolia")="Mongolia"}'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,536)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'in respect of the reporting period'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,572)">'
                    '<text font-family="Montserrat" font-size="12px" font-weight="400" fill="#5D5D68" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            'to'
                        '</textPath>'
                    '</text>'
                '</g>'
                '<g transform="translate(50,574)">'
                    '<text font-family="Montserrat" font-size="16px" font-weight="500" fill="#202024" text-anchor="middle" dominant-baseline="middle">'
                        '<textPath xlink:href="#center" startOffset="50%">'
                            '{startTime}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{endTime}'
                        '</textPath>'
                    '</text>'
                '</g>'
            '</svg>'
        );

        return  string(Base64.encode(imgBytes));
    }
}
