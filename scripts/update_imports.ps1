
$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts"

foreach ($file in $files) {
    $path = $file.FullName
    $content = Get-Content $path -Raw
    $originalContent = $content

    # Check if file is inside src/components/ui
    if ($path -like "*src\components\ui*") {
        # INTERNAL FILE: Fix upward relative imports
        # Regex: from " or ' followed by ../../ but NOT followed by another /..
        # We want to replace ../../ with ../../../
        $content = $content -replace "from (['`"])\.\./\.\./(?!=\.\.)", "from `${1}../../../"
    } else {
        # EXTERNAL FILE: Fix references to ui/
        $content = $content.Replace("from '../../../../ui/", "from '../../../../components/ui/")
        $content = $content.Replace("from '../../../ui/", "from '../../../components/ui/")
        $content = $content.Replace("from '../../ui/", "from '../../components/ui/")
        $content = $content.Replace("from '../ui/", "from '../components/ui/")
        $content = $content.Replace("from './ui/", "from './components/ui/")
        
         # Handle double quote variants
        $content = $content.Replace('from "../../../../ui/', 'from "../../../../components/ui/')
        $content = $content.Replace('from "../../../ui/', 'from "../../../components/ui/')
        $content = $content.Replace('from "../../ui/', 'from "../../components/ui/')
        $content = $content.Replace('from "../ui/', 'from "../components/ui/')
        $content = $content.Replace('from "./ui/', 'from "./components/ui/')
    }

    if ($content -ne $originalContent) {
        Write-Host "Updating $path"
        Set-Content -Path $path -Value $content -NoNewline
    }
}
