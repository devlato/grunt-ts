/// <reference path="../../defs/tsd.d.ts"/>

import path = require('path');
import fs = require('fs');
import util = require('util');

export var grunt: IGrunt = require('grunt');

// Converts "C:\boo" , "C:\boo\foo.ts" => "./foo.ts"; Works on unix as well.
export function makeRelativePath(folderpath: string, filename: string) {
    return path.relative(folderpath, filename).split('\\').join('/');
}

// From https://github.com/centi/node-dirutils/blob/master/index.js
// Slightly modified. See BAS

/**
 * Get all files from a directory and all its subdirectories.
 * @param {String} dirPath A path to a directory
 * @param {RegExp|Function} exclude Defines which files should be excluded.
     Can be a RegExp (whole filepath is tested) or a Function which will get the filepath 
     as an argument and should return true (exclude file) or false (do not exclude).
 * @returns {Array} An array of files
 */
export function getFiles(dirPath, exclude?) {
    return _getAll(dirPath, exclude, true);
};

/**
 * Get all directories from a directory and all its subdirectories.
 * @param {String} dirPath A path to a directory
 * @param {RegExp|Function} exclude Defines which directories should be excluded. 
    Can be a RegExp (whole dirpath is tested) or a Function which will get the dirpath 
    as an argument and should return true (exclude dir) or false (do not exclude).
 * @returns {Array} An array of directories
 */
export function getDirs(dirPath, exclude?: (filename: string) => boolean): string[] {
    return _getAll(dirPath, exclude, false);
};

/**
 * Get all files or directories from a directory and all its subdirectories.
 * @param {String} dirPath A path to a directory
 * @param {RegExp|Function} exclude Defines which files or directories should be excluded. 
    Can be a RegExp (whole path is tested) or a Function which will get the path 
    as an argument and should return true (exclude) or false (do not exclude).
 * @param {Boolean} getFiles Whether to get files (true) or directories (false).
 * @returns {Array} An array of files or directories
 */
function _getAll(dirPath, exclude, getFiles) {
    var _checkDirResult = _checkDirPathArgument(dirPath);
    var _checkExcludeResult;
    var items = [];

    if (util.isError(_checkDirResult)) {
        return _checkDirResult;
    }
    if (exclude) {
        _checkExcludeResult = _checkExcludeArgument(exclude);
        if (util.isError(_checkExcludeResult)) {
            return _checkExcludeResult;
        }
    }

    fs.readdirSync(dirPath).forEach(function (_item) {
        var _itempath = path.normalize(dirPath + '/' + _item);

        if (exclude) {
            if (util.isRegExp(exclude)) {
                if (exclude.test(_itempath)) {
                    return;
                }
            }
            else {
                if (exclude(_itempath)) { // BAS, match full item path
                    return;
                }
            }
        }

        if (fs.statSync(_itempath).isDirectory()) {
            if (!getFiles) {
                items.push(_itempath);
            }
            items = items.concat(_getAll(_itempath, exclude, getFiles));
        }
        else {
            if (getFiles === true) {
                items.push(_itempath);
            }
        }
    });

    return items;
}

/**
 * Check if the dirPath is provided and if it does exist on the filesystem.
 * @param {String} dirPath A path to the directory
 * @returns {String|Error} Returns the dirPath if everything is allright or an Error otherwise.
 */
function _checkDirPathArgument(dirPath) {
    if (!dirPath || dirPath === '') {
        return new Error('Dir path is missing!');
    }
    if (!fs.existsSync(dirPath)) {
        return new Error('Dir path does not exist: ' + dirPath);
    }

    return dirPath;
}

/**
 * Check if the exclude argument is a RegExp or a Function.
 * @param {RegExp|Function} exclude A RegExp or a Function which returns true/false.
 * @returns {String|Error} Returns the exclude argument if everything is allright or an Error otherwise.
 */
function _checkExcludeArgument(exclude) {
    if (!util.isRegExp(exclude) && typeof (exclude) !== 'function') {
        return new Error('Argument exclude should be a RegExp or a Function');
    }

    return exclude;
}
