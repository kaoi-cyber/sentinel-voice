// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Sentinel Voice report registry
/// @notice Stores the SHA-256 fingerprint of a Sentinel security report with a timestamp.
///         Anyone can later recompute a report's hash and check it was recorded here —
///         this proves the report wasn't changed, not that its analysis is correct.
///         Only the hash and risk level are stored: no transaction details or personal data.
contract SentinelReportRegistry {
    struct Record {
        address submitter;
        uint64 timestamp;
        string riskLevel;
    }

    mapping(bytes32 => Record) private records;
    uint256 public totalRecords;

    event ReportRecorded(bytes32 indexed reportHash, address indexed submitter, uint64 timestamp, string riskLevel);

    error AlreadyRecorded(bytes32 reportHash);
    error EmptyHash();

    function record(bytes32 reportHash, string calldata riskLevel) external {
        if (reportHash == bytes32(0)) revert EmptyHash();
        if (records[reportHash].timestamp != 0) revert AlreadyRecorded(reportHash);

        uint64 nowTs = uint64(block.timestamp);
        records[reportHash] = Record(msg.sender, nowTs, riskLevel);
        totalRecords += 1;
        emit ReportRecorded(reportHash, msg.sender, nowTs, riskLevel);
    }

    function verify(bytes32 reportHash)
        external
        view
        returns (bool recorded, address submitter, uint64 timestamp, string memory riskLevel)
    {
        Record storage r = records[reportHash];
        return (r.timestamp != 0, r.submitter, r.timestamp, r.riskLevel);
    }
}
