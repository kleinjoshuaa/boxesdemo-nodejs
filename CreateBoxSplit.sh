# Create new Split and update definitions for Boxed demo
# Paramaters:
# 1 - Workspace Name
# 2- Environment Name
# 3- Traffci Type
# 4- Split name
# 5- Admin API Key
#
# Example:
# CreateBoxSplit Default Production user front_end_choose_boxes API_KEY

workspaceId=$(curl -v -X GET -H "Content-Type:application/json" -H "Authorization: Bearer $5" https://api.split.io/internal/api/v2/workspaces  | jq ".objects[] | select(.name==\"$1\").id")

workspaceId="${workspaceId#\"}"
workspaceId="${workspaceId%\"}"

echo "Workspace Id $workspaceId"

curl -v -X POST -d"{\"name\":\"$4\",\"description\":\"description\"}"   -H "Content-Type:application/json"   -H "Authorization: Bearer $5"   https://api.split.io/internal/api/v2/splits/ws/$workspaceId/trafficTypes/$3

curl -v -X POST -d '{"treatments":[{"configurations": "{\"font_size\":\"large\",\"popup_message\":\"BigDiscount\",\"popup_value\":\"25%\"}", "name": "premium", "description": ""}, {"configurations": "{\"font_size\":\"large\",\"popup_message\":\"Discount\",\"popup_value\":\"10%\"}", "name": "standard", "description": ""}, {"configurations": "{\"font_size\":\"large\",\"popup_message\":\"Thanksforboxing\",\"popup_value\":\"\"}", "name": "current", "description": ""}],"defaultTreatment":"current","rules":[], "defaultRule":[{"treatment": "current", "size": 100}]}' -H "Content-Type:application/json"  -H "Authorization: Bearer $5" https://api.split.io/internal/api/v2/splits/ws/$workspaceId/$4/environments/$2
