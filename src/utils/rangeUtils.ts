
import * as vscode from 'vscode';

export function rangesOverlap(range1: vscode.Range, range2: vscode.Range): boolean {
    return !(range1.end.isBefore(range2.start) || range2.end.isBefore(range1.start));
}
