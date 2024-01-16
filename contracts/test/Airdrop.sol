// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract Airdrop is Ownable {

    address public token;
    address public from;
    uint256 public value;

    constructor (address _token, address _from, uint256 _value ) {
        token = _token;
        from = _from;
        value = _value;
    }

    function setParams(address _token, address _from, uint256 _value) external onlyOwner {
        if (_token != address(0)) {
            token = _token;
        } if (from != address(0)) {
            from = _from;
        } else if (_value != 0) {
            value = _value;
        }
    }

    function airdrop(address[] calldata recipients) external onlyOwner {
        address pool = from;
        for (uint256 index = 0; index < recipients.length; index++)
            require(IERC20(token).transferFrom(pool, recipients[index], value));
    }

    function airdropWithValue(address[] calldata recipients, uint256[] calldata values) external onlyOwner {
        require(recipients.length == values.length, "Wrong Length" );
        address pool = from;
        for (uint256 index = 0; index < recipients.length; index++)
            require(IERC20(token).transferFrom(pool, recipients[index], values[index]));
    }

    function airdropGeneric(address dropToken, address dropFrom, uint256 dropValue, address[] calldata recipients) external onlyOwner {
        for (uint256 index = 0; index < recipients.length; index++)
            require(IERC20(dropToken).transferFrom(dropFrom, recipients[index], dropValue));
    }

    function airdropGenericValue(address dropToken, address dropFrom, address[] calldata recipients, uint256[] calldata values) external onlyOwner {
        require(recipients.length == values.length, "Wrong Length" );
        for (uint256 index = 0; index < recipients.length; index++)
            require(IERC20(dropToken).transferFrom(dropFrom, recipients[index], values[index]));
    }

}